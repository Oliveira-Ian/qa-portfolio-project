# 0018 — Authorization in four layers: platform role, membership, product access, product permissions

## Context

The Platform is the place a user signs in and the place companies, their members and the products they
use are administered ([0015](0015-platform-portal-and-central-identity.md)). Two things in the
records so far do not fit that intent:

- [0004](0004-role-vs-profile.md) gives `ADMIN` a bypass on every permission check. With products,
  that means an administrator of the Platform (or of a company) would be an administrator of every
  product, which is not what is wanted: administering the Platform is not administering the products.
- [0015](0015-platform-portal-and-central-identity.md) plans product access **per company**, decided
  by `SUPER_ADMIN`, and defers building it until a second product exists. What is wanted is two
  levels — the company contracts a product (with a seat limit), and the company's administrator then
  says which of its members may use it — and there are now two products (the existing ERP and the
  coming FSM).

The specification is [`docs/especificacoes/platform-access-model.md`](../especificacoes/platform-access-model.md).

## Decision

**Four layers, each answering one question, checked in this order:**

| Layer | Question | Held by |
|---|---|---|
| 1. Platform role | Does this account administer the Platform itself? | `AccessAccount.role` — `SUPER_ADMIN`, `USER`, `SYSTEM` |
| 2. Membership | Does this account belong to an active company, and does it administer that company? | `Membership` (`ADMIN` \| `MEMBER`, status) |
| 3. Product access | Has the company contracted the product, and was this member granted a seat? | `CompanyProduct` (contract, `seatLimit`) and `ProductAccess` (the seat) |
| 4. Product permissions | What may this member do *inside* the product? | The product's own profiles and permissions |

**Nothing above a layer grants anything in the layer below.** `SUPER_ADMIN` manages companies and
contracts and has no access to any company's business data (already 0013). A company `ADMIN` manages
members and their seats and is not thereby an administrator of a product. Whoever needs to use a
product grants it to themselves, as any other member. The `ADMIN` bypass of 0004 is **removed**:
`requirePermission()` no longer exempts any role.

**Product access is a record, not a permission inside a profile.** Access to a product is counted
against the contract (`seatLimit`), audited and revoked as a unit; a permission attached to a profile
cannot be counted, because one profile is shared by many members. So a seat is a `ProductAccess` row
per (membership, product), and product permissions stay exclusively in profiles. There is one
mechanism for permissions, not two.

**Seats are limited per (company × product)** — the answer to "per company, product or plan". A plan or
subscription becomes, later, the *source* of `seatLimit`; the point where the limit is checked does not
change. A seat is a `ProductAccess` of an **active** membership. Granting a seat runs in one
transaction that locks the company row, so two concurrent grants cannot go over the limit.

**Every product route is protected in the API.** `requireProductAccess(product)` runs before the
route's own `requirePermission(...)`. The web's area layouts repeat the check for the user's benefit,
but the boundary is the API (Server Actions are public endpoints).

**Roles renamed.** `AccountRole.ADMIN` becomes `SUPER_ADMIN`, the name of 0013, so it cannot be
mistaken for the `ADMIN` of a company's membership. `USER` and `SYSTEM` are unchanged.

**No automatic access.** Self-registration creates an account with no membership, no seat and no
profile. The signed-in user lands on the Platform home with a message that they have no access yet.
The `isDefault` profile is linked when a member is first granted the ERP, not at registration.

**Audit, minimal.** A seat records who granted it and when. Every grant, revocation and change of
status or role of a membership emits a structured log event (`access.product.granted`, …) with actor,
target, company and product, which the existing OpenTelemetry pipeline
([0017](0017-observability-opentelemetry-lgtm.md)) carries to Loki. A persisted, queryable trail is
F-15 (#7), which absorbs these events.

## What this does not decide

- **Isolation of business data.** `Person`, profiles and the rest are still not company-scoped; that is
  #60 ([0012](0012-tenant-isolation-extension-and-rls.md)). The identity tables of this record are
  global, as 0012 already treats them. **Until #60 lands there is exactly one company and no way to
  create another**: no endpoint provisions a company before then.
- **Joining a company.** Until invitations exist, a company administrator can add an existing,
  company-less account by e-mail (generic answer, no enumeration through the response). Invitations
  replace this before a second company exists.
- One active membership per account. The API refuses an account that has more than one until company
  switching exists (F-12, #6).
- Contracts, plans, billing, support access for `SUPER_ADMIN` ("break-glass", explicit, temporary,
  audited), branches, and the FSM's own profiles.

## Consequences

- 0004 is superseded on the bypass; its role/profile distinction stands and is sharpened.
  `GET /api/auth/me` and the web's `can()` stop re-applying an admin exemption: they report exactly what
  the profiles grant.
- `PERMISSION_CATALOG` is, today, the ERP's catalog. When the FSM has its first permission the catalog
  gains a product dimension; not before.
- The lockout guards of 0004 become several: the last active `SUPER_ADMIN`, the last `ADMIN` of a
  company, and the last member of a company able to manage the ERP's profiles (`profile:manage`).
  Each is checked inside the same transaction as the change, with the company row locked.
- The session cookie is renamed in the same change: a leftover cookie carrying `role: "ADMIN"` would
  otherwise fail validation after `proxy.ts` accepted its shape, and loop between `/login` and `/home`.
- A user without access to any product is a normal state, not an error.
