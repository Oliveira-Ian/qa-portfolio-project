# 0013 — Company, membership and platform roles

## Context

[0008](0008-multi-tenancy-shared-database.md) left several questions to the F-12 specification:
hierarchy inside a company, a second level of tenancy, a platform-level super-admin, and how the
global identity relates to `Person`. Four of them are now decided. This record states the boundaries;
the data model, field names and flows are still settled in the F-12 specification, and each item
below is confirmed or adjusted there before anything is implemented.

## Decision

- **`Company` is the unit of isolation.** A person who serves several companies (an accountant, a
  consultant) is a member of each through a `Membership`. There is no parent/child tenant and no
  reseller level, and none is to be introduced without a new explicit decision. A separate `Tenant`
  entity above `Company` is not introduced by this record; if the specification finds it needs one,
  it says so there.
- **`Branch` is modelled, not built.** Scoping by branch later must be a matter of adding a column,
  so the design must not rule it out — but no branch exists, is enforced by RLS or is tested in
  Phase 2.
- **`User` is independent of `Person`.** A user is a global credential (one login for the whole
  Platform). It **may** be linked to a `Person`, but does not have to be, and the link is per company
  since `Person` records are company data. This replaces today's 1:1 `AccessAccount.personId`.
  `Membership` ties a user to a company and carries the profiles and permissions there.
  `Person.types = USER` therefore goes away.
- **Two administrative levels, separate.**
  - `ADMIN` administers **only its own company**, its users and its data. Expected: this becomes a
    property of the membership rather than of the global account, so being an administrator in one
    company grants nothing in another. The lockout guards of ADR 0004 become per company.
  - `SUPER_ADMIN` administers the **platform**: provisions and suspends companies and does
    operational work. It has **no default access to any company's business data**, and cannot see
    other companies as an ordinary user would. Any exceptional access to data is explicit, temporary
    and audited. It is a distinct role from `ADMIN`, not a stronger `ADMIN`, and it does not enter
    through the RLS bypass of [0012](0012-tenant-isolation-extension-and-rls.md) by default.

## Consequences

- The F-12 specification is written against these boundaries and settles what remains: entity and
  field names, how a company is provisioned (expected: a signed-in user creates one, members join by
  invitation, and the product's template is copied into it — see 0011), the scope of
  `GridColumnPreference`, and how `SUPER_ADMIN`'s explicit access is requested, limited and logged.
- Self-registration splits in two — create a company, or join by invitation — instead of creating a
  person with the default profile (`POST /api/auth/register`).
- Nothing about branches, resellers or a hierarchy of tenants is designed, stubbed or tested until a
  new decision reopens it.
