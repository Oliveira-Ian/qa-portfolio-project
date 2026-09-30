# Access Control — Oliveira Platform

How identity, companies, product access and permissions fit together. `docs/product/domain.md` covers
what each entity _is_; this document covers how they interact to decide who can do what. The reasoning
is in [ADR 0018](../adr/0018-authorization-layers-and-product-access.md) and
[ADR 0019](../adr/0019-erp-existing-product-and-product-areas.md); the data, endpoints and the
acceptance matrix are in [`docs/especificacoes/platform-access-model.md`](../especificacoes/platform-access-model.md).

## The model: four layers

```
AccessAccount ── one login for the whole Platform
   │ role: SUPER_ADMIN | USER | SYSTEM                 layer 1 — the Platform
   ▼
Membership ── account × company, role ADMIN | MEMBER   layer 2 — the company
   │
   ├── CompanyProduct ── the company's contract for a product, with a seat limit
   └── ProductAccess  ── this member's seat in a product          layer 3 — the product
                                  │
                                  ▼
       AccessProfile N──N Permission  ── what the member does inside the product   layer 4
```

Each layer answers one question, and **none grants anything in the next**:

| Layer | Question | Held by | Checked by |
|---|---|---|---|
| 1. Platform | Does this account administer the Platform itself? | `AccessAccount.role` | `requireRole('SUPER_ADMIN')` |
| 2. Company | Does it belong to an active company, and administer it? | `Membership.role` | `requireCompanyAdmin` |
| 3. Product | Did the company contract the product, and was this member granted a seat? | `CompanyProduct`, `ProductAccess` | `requireProductAccess('ERP')` |
| 4. Permissions | What may it do inside the product? | the product's profiles | `requirePermission('person:view')` |

- **`SUPER_ADMIN`** is the Oliveira team. It changes an account's global role and active flag (and, in
  a later phase, administers companies and contracts). It has **no access to any product and no default
  access to any company's data**: to use the ERP it needs a membership and a seat like anyone else.
- **Company `ADMIN`** administers its own company only: its members, their status and company role,
  and the seats it grants within the contracted limit. It cannot change contracts or limits, sees no
  other company, and is **not** thereby an administrator of a product.
- **A seat** is what a member needs to enter a product. Granting one is counted against the company's
  `seatLimit` for that product.
- **`Permission`** is a sealed catalog entry, `resource:action` (`person:view`, `profile:manage`, …),
  defined in code (`packages/schemas/src/permissions.ts`) and seeded into the database. Today the
  catalog is the ERP's. **`AccessProfile`** is a named bundle of them; an account may hold any number,
  and its effective set is their union.

**There is no bypass.** No role is exempt from `requirePermission()`; a `SUPER_ADMIN` or a company
`ADMIN` who wants to work in the ERP grants themself the seat and holds a profile, as anyone would.
(This replaces the `ADMIN` bypass of ADR 0004.)

**Every ERP route needs a seat**, in the API — `requireProductAccess('ERP')` runs before the route's own
permission on `/api/persons`, `/api/profiles`, `/api/permissions` and the ERP parts of `/api/accounts`.
The web's ERP layout also refuses to render the page without a seat, but that is only the polite half:
Server Actions are public endpoints, so the API is the boundary.

## Who may call what

| Route | Guard |
|---|---|
| `GET /api/auth/me` | signed in |
| `/api/persons/*` | ERP seat + `person:*` |
| `/api/profiles/*`, `/api/permissions` | ERP seat + `profile:manage` |
| `GET /api/accounts`, `/:id` | ERP seat + (`profile:manage` or company `ADMIN`), scoped to the caller's company |
| `POST /api/accounts` (give a person a login) | ERP seat + company `ADMIN`; the login joins the company, with no seat and no profile |
| `POST`/`DELETE /api/accounts/:id/profiles…` | ERP seat + `profile:manage`; the target must hold an ERP seat |
| `PATCH /api/accounts/:id` (global role, active) | `SUPER_ADMIN` |
| `/api/company/members…` | company `ADMIN` (needs no seat) |
| `/api/grid-preferences/*` | signed in |

## Where the truth is read

**The token proves identity only.** The session token carries `{ sub, personId, name, email, role }`, but
the API trusts it for exactly one thing: _which account is calling_. On every request `requireAuth`
(`apps/api/src/modules/auth/require-auth.ts`) reads that account from the database and rejects it with
`401` if it no longer exists or is deactivated; the `role` is the database's. It then reads the
account's active membership, its company's contracts and its seats
(`apps/api/src/modules/company/company.service.ts#resolveAccess`) and puts the company in the request
context (`docs/adr/0016`). So deactivating an account, revoking a seat, deactivating a membership or
suspending a contract takes effect on the account's very next request, not when its 8-hour token
expires. (The copy of `name`/`role` in the token and in `apps/web`'s session cookie is only for
display; nothing authorises against it.) The price is a primary-key lookup and one membership query
per request.

**Permissions never enter the JWT.** With N profiles per account, baking permissions into the token
would mean they go stale the moment an administrator changes a profile mid-session. `GET /api/auth/me`
resolves the effective set at read time (`permissions.service.ts#getEffectivePermissions`) — and
reports it only while the account holds an ERP seat — and `apps/web` calls it once per request via
React's `cache()` (`apps/web/lib/permissions.ts#getMe`). `can()` reads exactly that list: there is no
administrator exemption to re-apply, so it cannot hide what the API allows or show what it refuses.

**One active membership per account** until company switching exists (F-12). An account with more than
one is refused with `403`; the API never picks one silently.

## Registration and joining a company

`POST /api/auth/register` creates the `Person` and the `AccessAccount` together, in one transaction
(`accountRepository.createWithPerson`) — and **nothing else**: no membership, no seat, no profile. The
new user can sign in and sees that they have no access yet.

To get in, a company administrator either:

- adds the account by e-mail (`POST /api/company/members`) — the answer is always the same generic
  message, so it never says whether an address has an account; it adds only an active, non-`SYSTEM`
  account with no company. This stands in for invitations, which replace it before a second company
  exists; or
- gives a person of the registry a login (`POST /api/accounts`,
  `accountRepository.createForPerson`) — the login becomes a member of the administrator's company.

Then the administrator grants a seat (`PUT /api/company/members/:id/products/ERP`). **The first ERP seat
of an account with no profile links the `isDefault` profile**; an account that already holds profiles
keeps them. Revoking a seat leaves the profile links in place (dormant without the seat).

No document is collected and no `CLIENT` record is created — a person registering for the app is not
automatically a customer of the business the app runs for.

## Seats and limits

`CompanyProduct.seatLimit` (null = unlimited) is per company × product. A seat used is a
`ProductAccess` of an **active** membership. Granting a seat runs in one transaction that locks the
company row, so two concurrent grants cannot go past the limit; at the limit the answer is `409`,
`No licenses left for Oliveira ERP. Contact Oliveira to raise the limit.` Granting a seat the member
already holds is a no-op. Deactivating a membership frees its seats. Contracts and limits are written
by the Oliveira team (the seed, later the console), never by a company's administrator.

## Lockout guards

Each is a `409`, checked in the same transaction as the change with the company row locked
(`apps/api/src/modules/company/company-guards.ts`):

- **The last active `SUPER_ADMIN`** cannot be deactivated or demoted, and a `SUPER_ADMIN` cannot
  demote or deactivate themself (`account-guards.ts`).
- **The last active company `ADMIN`** cannot be demoted or deactivated.
- **The last member able to manage the ERP's profiles** — an active member with an ERP seat and a
  profile that carries `profile:manage` — cannot lose that: by unlinking the profile, by editing or
  deleting a profile that carries the permission, by revoking the ERP seat, or by being deactivated.
  Without it, nobody could change who may do what in the ERP without database access.

`SYSTEM` and inactive accounts are excluded from login (`auth.service.ts`) regardless of role, checked
before the password even.

## Audit

Every grant, revocation and change of a membership's status or role emits a structured log line
(`access.product.granted`, `access.product.revoked`, `access.membership.added`,
`access.membership.updated`) with the actor's account id, the company, the target and the product — ids
only, no e-mail or name. A seat also records who granted it and when (`ProductAccess.grantedById`,
`grantedAt`). The lines reach Loki through the OpenTelemetry pipeline (`docs/operations/observability.md`);
a persisted, queryable trail belongs to F-15 (#7).

## What's deliberately not here

- **Isolation of business data between companies.** `Person`, profiles and the rest are not yet
  company-scoped; that is #60 (`docs/adr/0012`). Until it lands there is exactly one company and
  nothing provisions another. The accounts listing and profile links are already scoped to the caller's
  company; the business tables are not.
- **Invitations, company switching, contracts/plans/billing, branches, support access for
  `SUPER_ADMIN`.** See ADR 0018's "What this does not decide".
- **Password reset for existing accounts.** `AccountUpdateInput` only covers `active`/`role`.
- **Per-account permission overrides.** An account's permissions are exactly the union of its
  profiles' — if a permission set doesn't fit an existing profile, the answer is a new profile.
- **Login by `login`.** `AccessAccount.login` exists in the schema (unique, nullable) for future
  username login, but nothing reads it — `email` is the only credential `/api/auth/login` accepts.

## Adding a new permission

1. Add the entry to `PERMISSION_CATALOG` in `packages/schemas/src/permissions.ts`
   (`{ resource: 'service-order', action: 'approve', label: 'Approve service orders' }`).
2. Re-run `npm run db:seed` — `seedPermissions()` upserts by `(resource, action)`, so this is safe to
   run against a database that already has data. The seeded Administrator profile is re-synced to hold
   the whole catalog.
3. Guard the route: `app.addHook('preHandler', requirePermission('service-order:approve'))`, or per-route,
   after the product's `requireProductAccess`.
4. The profiles screen needs no code change — its permission picker reads the live catalog from
   `GET /api/permissions` and groups by `resource` automatically.

When the FSM has its first permission the catalog gains a product dimension (ADR 0018); until then every
entry is the ERP's.
