# 0013 — Company, membership and platform roles

> **Refined by [0018](0018-authorization-layers-and-product-access.md):** the company `ADMIN` also
> grants members their seat in each contracted product, within a limit `SUPER_ADMIN` sets, and neither
> role administers a product by being an administrator. Membership, `Company` and the roles below are
> introduced in that record's first phase, ahead of the isolation work of #60.

## Context

[0008](0008-multi-tenancy-shared-database.md) left several questions to the F-12 specification:
hierarchy inside a company, a second level of tenancy, a platform-level super-admin, and how the
global identity relates to `Person`. Four of them are now decided. This record states the boundaries;
the data model, field names and flows are still settled in the F-12 specification, and each item
below is confirmed or adjusted there before anything is implemented.

## Decision

- **`Company` is the unit of isolation, and there is no `Tenant` entity.** The model is
  `Company → Membership → User`. A person who serves several companies (an accountant, a
  consultant) is a member of each through a `Membership`. There is no parent/child tenant and no
  reseller level, and none — nor a `Tenant` above `Company` — is to be introduced without a new
  explicit decision.
- **`Branch` is only conceptual for now.** Scoping by branch later must be a matter of adding a
  column, so the design must not rule it out — but no branch is built, enforced by RLS or tested
  in Phase 2.
- **`User` is independent of `Person`.** A user is a global credential (one login for the whole
  Platform). It **may** be linked to a `Person`, but does not have to be, and the link is per company
  since `Person` records are company data. This replaces today's 1:1 `AccessAccount.personId`.
  `Membership` ties a user to a company and carries the profiles and permissions there.
  `Person.types = USER` therefore goes away. `Person` itself stays generic and carries no product
  classification ([0011](0011-platform-shape.md)).
- **Two administrative levels, separate.**
  - `ADMIN` administers **only its own company**, its users and its data. Expected: this becomes a
    property of the membership rather than of the global account, so being an administrator in one
    company grants nothing in another. The lockout guards of ADR 0004 become per company.
  - `SUPER_ADMIN` is a user **of the Oliveira Platform** ([0015](0015-platform-portal-and-central-identity.md)).
    It administers the ecosystem: provisions and suspends companies, and manages which products each
    company has access to. Administering the Platform and accessing a company's business data are
    **separate concepts**, so it has **no default access to any company's business data** and cannot
    see other companies' data as an ordinary user would. Any exceptional access to data is
    explicit, temporary and audited. It is a distinct role from `ADMIN`, not a stronger `ADMIN`, and
    it does not enter through the RLS bypass of
    [0012](0012-tenant-isolation-extension-and-rls.md) by default.

## Consequences

- The F-12 specification is written against these boundaries and settles what remains: field names
  (the entities `Company` and `Membership` are named here), how a company is provisioned (expected: a signed-in user creates one, members join by
  invitation, and the product's template is copied into it — see 0011), the scope of
  `GridColumnPreference`, and how `SUPER_ADMIN`'s explicit access is requested, limited and logged.
- Self-registration splits in two — create a company, or join by invitation — instead of creating a
  person with the default profile (`POST /api/auth/register`).
- Nothing about branches, resellers or a hierarchy of tenants is designed, stubbed or tested until a
  new decision reopens it.

## Addendum (2026-11-10): `User` and `Person` decoupled

Done with the first company-scoped table (#60, [0012](0012-tenant-isolation-extension-and-rls.md)),
because `Person` could not become company data while every account owned one: an account exists
before it has a company (registration, `SUPER_ADMIN`, `SYSTEM`), and a person record is a company's.

- `AccessAccount` keeps its own display `name`; `AccessAccount.personId` is gone. The session token,
  the request's actor and `GET /api/auth/me` no longer carry a person.
- `Membership.personId` (optional) links a member to their record **in that company's registry** — a
  composite key `(companyId, personId)`, unique per company, `ON DELETE RESTRICT`.
- `Person` has a NOT NULL `companyId` and is under row-level security; its document is unique per
  company. Existing rows were assigned to the single company that existed.
- Registration creates the login only. `Person.types = USER` is no longer written; the value is
  left in the enum for the rows that have it.
- The ERP's "give this person a login" keeps working: the account takes the person's name and joins
  the company as a member linked to them.

## Addendum (2026-11-10): `Branch`, and what the account administrator is

Decided by the product owner for the FSM V1, reopening "`Branch` is only conceptual" in the smallest
form that serves it:

- `Branch` is **Foundation data of the company** (`companyId` NOT NULL, row-level security) — one
  table, shared by every product, never duplicated per product. A company has any number of branches;
  a branch is not a company and not a Platform account.
- Branches are **managed inside the products**, with each product's own permissions (the FSM's
  `branch:*`), through the same API plugin mounted per product, as the products' profiles are. The
  Platform does not manage them. A branch referenced by any record is deactivated rather than deleted.
- A work order may name a branch (optional), and work orders can be filtered by it.
- `Membership.role` (`ADMIN`/`MEMBER`) is kept **only** for administering the company's account on
  the Platform — its registration, members and product access. It never grants or restricts anything
  inside a product, and no product route reads it. The company's registration (legal name, CNPJ, state
  and municipal registration, contact, main address) is central Platform data: the account
  administrator edits all of it but the legal name and the CNPJ, which only Oliveira changes; products
  show it, never edit it.

Still **not** built, and expected later: profiles restricted to a branch (a nullable `branchId` on
`MembershipProfile`), members limited to some branches, an "active branch" in the session, transfers
between branches, and per-branch reports.
