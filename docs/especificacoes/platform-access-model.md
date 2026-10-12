# Platform access model — companies, members, product seats

Specification for Epic #66 (Oliveira Platform portal and central identity). The decisions are recorded in
[ADR 0018](../adr/0018-authorization-layers-and-product-access.md) (the four layers) and
[ADR 0019](../adr/0019-erp-existing-product-and-product-areas.md) (the ERP as an existing product, product
areas). This document is what the Features are built and accepted against.

## Objective

One account, one sign-in, and a controlled way into each product: a user sees and enters only the
products their company contracted **and** their company's administrator granted them, and inside a
product does only what the product's profiles allow. Nobody gets a product by being an administrator.

## Scope of this specification

Delivered in phases (see the Epic's sub-issues):

- **Phase 2 — API:** the data, the guards, the members and seats endpoints.
- **Phase 3 — Web:** the product areas and the Platform home (after the visual identity is approved).
- **Phase 4 — Web:** company members and the ERP's access-control screens.
- **Phase 6 — Web/API:** the Oliveira console. Phase 5 is #60 (company data isolation).

Out of scope: invitations, contracts/plans/billing, company switching, branches, support access for
`SUPER_ADMIN`, the FSM's own profiles, the `User`/`Person` decoupling of ADR 0013.

## Data model

Global identity tables (not company-scoped; ADR 0012 treats these separately).

| Entity | Fields | Rules |
|---|---|---|
| `Product` (enum) | `ERP`, `FSM` | Adding a product is code (migration, routes, screens). |
| `AccountRole` (enum) | `SUPER_ADMIN`, `USER`, `SYSTEM` | `ADMIN` is renamed `SUPER_ADMIN`. `SYSTEM` cannot sign in. |
| `Company` | `id` (UUID v7), `legalName`, `tradeName?`, `document?` (CNPJ, unique), `status` (`ACTIVE`\|`SUSPENDED`), timestamps | A suspended company's members cannot enter any product. |
| `Membership` | `id` (UUID v7), `accountId`, `companyId`, `role` (`ADMIN`\|`MEMBER`), `status` (`ACTIVE`\|`INACTIVE`), timestamps; unique (`accountId`, `companyId`) | One **active** membership per account until company switching exists. |
| `CompanyProduct` | `companyId`, `product`, `status` (`ACTIVE`\|`SUSPENDED`), `seatLimit?` (null = unlimited); key (`companyId`, `product`) | The contract. Written only by `SUPER_ADMIN` (console, Phase 6) and the seed. |
| `ProductAccess` | `membershipId`, `product`, `grantedById`, `grantedAt`; key (`membershipId`, `product`) | A seat. Written by the company's `ADMIN`. |

Unchanged for now: `AccessAccount.personId`, `AccountProfile` (still per account), `AccessProfile` and
`Person` without a company column (#60).

**Access to product P** = active account ∧ active membership ∧ active company ∧ `CompanyProduct(P)` active ∧
`ProductAccess(P)` of that membership. **Seats used** for (company, P) = the `ProductAccess(P)` rows whose
membership is active.

## Roles and what each may do

| Actor | May |
|---|---|
| Any signed-in account | Read `/me`, sign out, see the Platform home (its own systems, or "no access yet"). |
| `MEMBER` with a seat | Use the product, as its profiles allow. |
| Company `ADMIN` | List their company's members; add a member; change a member's status or company role; grant or revoke a seat within `seatLimit`; create a login for an existing person (the login becomes a member of their company). Not: change contracts or limits, act on other companies, change an account's global role or active flag. |
| ERP profile manager (holds `profile:manage`, has an ERP seat) | Manage the ERP's profiles; list their company's ERP members; attach/detach ERP profiles. |
| `SUPER_ADMIN` | Change an account's global role and active flag. Console (Phase 6): companies, contracts, limits. **Nothing else, and no product** unless it also holds a membership and a seat like anyone. |

No role bypasses a permission check.

## Business rules

1. **No automatic access.** `POST /api/auth/register` creates the account (and, as today, its `Person`); no
   membership, no seat, no profile.
2. **First ERP seat links the default profile.** Granting the ERP to a member with no profile links the
   `isDefault` profile; a member who already holds profiles keeps them. Revoking a seat leaves profile links
   in place (dormant).
3. **Seat limit.** Granting when seats used = `seatLimit` fails with `409` and the message
   `No licenses left for <product>. Contact Oliveira to raise the limit.` The check and the insert run in
   one transaction with the company row locked. Granting an existing seat is a no-op.
4. **Contract gate.** A seat can only be granted for a product with an active `CompanyProduct` for that company.
   If the contract is later suspended, the seats stay but confer no access.
5. **Deactivating a membership** (status `INACTIVE`) removes all access at once and frees its seats.
6. **Lockout guards** (each `409`, checked in the same transaction as the change, company row locked):
   - the last active `SUPER_ADMIN` cannot be demoted or deactivated, and no `SUPER_ADMIN` can demote or
     deactivate themself;
   - the last active company `ADMIN` cannot be demoted or deactivated;
   - the last member of a company able to manage the ERP's profiles (`profile:manage` through an ERP seat
     and an active membership) cannot lose it — by unlinking a profile, editing or deleting a profile that
     carries it, revoking the ERP seat, or deactivating the membership.
7. **Adding a member by e-mail** (until invitations exist): the answer is always
   `200` with the same generic message. It adds the member only if an active, non-`SYSTEM` account with that
   e-mail exists and has no membership yet.
8. **One active membership per account.** An account that has more than one is refused with `403`
   (`This account belongs to more than one company`) until company switching exists.
9. **`GET /api/accounts` and profile links** are scoped to the caller's company: only accounts that are
   members of it, and profiles can only be attached to a member holding an ERP seat.
10. **Audit events** (structured log, not persisted): `access.product.granted`, `access.product.revoked`,
    `access.membership.added`, `access.membership.updated`, each with actor account, company, target
    membership and product where they apply.

## API

New (`apps/api/src/modules/company/`):

| Route | Guard | Notes |
|---|---|---|
| `GET /api/company/members` | company `ADMIN` | Members of the caller's company, with their seats; also `company.products[]` = `{ product, status, seatLimit, seatsUsed }`. |
| `POST /api/company/members` | company `ADMIN` | Body `{ email }`. Rule 7. |
| `PATCH /api/company/members/:id` | company `ADMIN` | Body `{ status?, role? }`. Rule 6. |
| `PUT /api/company/members/:id/products/:product` | company `ADMIN` | Grant a seat. Rules 2–4. |
| `DELETE /api/company/members/:id/products/:product` | company `ADMIN` | Revoke a seat. Rule 6. |

Changed:

| Route | Before | After |
|---|---|---|
| `GET /api/auth/me` | account, person, permissions | + `membership` (`{ id, companyId, companyName, role }` or `null`) and `products` (the products the account may enter). `permissions` is `[]` without an ERP seat. |
| `/api/persons/*` | `requirePermission` | `requireProductAccess('ERP')` first, then `requirePermission` |
| `/api/profiles/*`, `/api/permissions` | role `ADMIN` | `requireProductAccess('ERP')` + `requirePermission('profile:manage')` |
| `GET /api/accounts`, `GET /:id` | role `ADMIN` | ERP seat + (`profile:manage` **or** company `ADMIN`); scoped to the company (rule 9) |
| `POST /api/accounts/:id/profiles`, `DELETE …/:profileId` | role `ADMIN` | ERP seat + `profile:manage`; rule 9 |
| `POST /api/accounts` | role `ADMIN` | ERP seat + company `ADMIN`; creates the membership (`MEMBER`, active), no seat, no profile |
| `PATCH /api/accounts/:id` | role `ADMIN` | `SUPER_ADMIN` only (global `role`/`active`) |
| `/api/grid-preferences/*` | session | unchanged |

New permission in the catalog: `profile:manage` — "Manage profiles and their access" (ERP).

## Access matrix (acceptance)

Five accounts, seeded or registered (test accounts behind `SEED_TEST_ACCOUNTS`):

| Account | Global role | Membership | ERP seat | Profile |
|---|---|---|---|---|
| A. Super admin | `SUPER_ADMIN` | none | — | — |
| B. Company admin | `USER` | `ADMIN` | no | — |
| C. ERP member | `USER` | `MEMBER` | yes | Default User (`person:view`) |
| D. Member without seat | `USER` | `MEMBER` | no | — |
| E. Newly registered | `USER` | none | — | — |

| Request | A | B | C | D | E |
|---|---|---|---|---|---|
| `GET /api/auth/me` | 200 | 200 | 200 | 200 | 200 |
| `GET /api/persons` | 403 | 403 | 200 | 403 | 403 |
| `POST /api/persons` | 403 | 403 | 403 | 403 | 403 |
| `GET /api/profiles` | 403 | 403 | 403 | 403 | 403 |
| `GET /api/company/members` | 403 | 200 | 403 | 403 | 403 |
| `PATCH /api/accounts/:id` | 200 | 403 | 403 | 403 | 403 |

Also: a company `ADMIN` who grants themself the ERP seat and holds an ERP profile with `profile:manage`
reaches `/api/profiles` (200); revoking the seat removes it on the next request.

## Screens (Phases 3–4, after the design is approved)

- Platform home: cards for the products in `me.products`; the "no access yet" state.
- "No access to this system" page when an area is entered without a seat.
- `/company/members`: members, seats used / limit per product, grant/revoke, add by e-mail, status.
- ERP: dashboard, people, and `settings/access-control/{profiles,users}` moved under `/erp`.

## Testing impact (no tests written in this specification's phases)

- `tests/e2e/auth.spec.ts` (active): register → sign in → `/home` with `home-page` visible. It stays valid:
  until Phase 3 the notice for a user without a seat is wrapped in that testid, afterwards the Platform
  home carries it. It no longer needs the seeded database.
- `tests/unit/request-context.test.ts` uses the literal role `'ADMIN'`; with the rename it no longer
  type-checks. Report, do not edit, unless asked.
- The access matrix above, seat-limit concurrency, the lockout guards, revocation on the next request and
  the legacy redirects are the cases for the QA phase. Tenant-isolation tests remain the approved
  exception and belong to #60.

## Acceptance criteria

1. The matrix above holds exactly, checked with real requests.
2. A `SUPER_ADMIN` without a membership and a seat gets `403` on every ERP route.
3. The 11th seat with `seatLimit = 10` is refused; two concurrent grants for the last seat yield one success.
4. A company `ADMIN` cannot change contracts, limits or an account's global role, and sees no other company.
5. Each lockout guard of rule 6 refuses the change and leaves the data as it was.
6. Revoking a seat or deactivating a membership takes effect on the account's next request.
7. Migrations apply to an empty database and to the current development database; the seed runs twice
   without duplicating anything and gives the bootstrap admin `SUPER_ADMIN`, a company `ADMIN`
   membership, ERP and FSM seats and the Administrator profile.
8. The ERP the bootstrap admin uses today keeps working.
