# 0008 — Multi-tenancy: shared database, global identity, membership per company

## Context

This repository is being repositioned as the **Foundation** of the Oliveira Platform — a reusable
base for many future products rather than a single application. Multi-tenancy was explicitly out of
scope until now (`docs/product/access_control.md`, "What would change for multi-tenant"), and no
table carries a tenant column today.

The decision could not be made on technical grounds alone: all the usual models (one instance per
customer, a row discriminator on a shared database, one schema per tenant, one database per tenant,
or a hybrid) are correct in some context. What settled it were four facts about how the Platform
will be sold and used:

- **Many customer companies, entering through self-service** — a new company has to exist in
  seconds, not in a deployment.
- **Logical isolation is sufficient** — no product or contract requires a customer's data to sit in
  a separate database.
- **One company registry for the whole Platform** — a customer using two Platform products is the
  same company, with the same users and one login.
- **A user must be able to belong to several companies** — an accountant serving many clients, a
  franchisor seeing its franchises.

The first fact rules out one-instance-per-customer and one-schema-per-tenant (Postgres degrades
with thousands of schemas, and every migration would have to sweep all of them). The second removes
the reason to pay for one-database-per-tenant or a hybrid. The fourth rules out per-customer
instances a second time.

## Decision

**Shared database, single schema, `tenantId` discriminator**, with the identity layer deliberately
kept outside the tenant.

1. **Data is scoped by company.** A company/tenant model is introduced, and business tables carry
   its id — `Person`, `AccessProfile`, and every future business table. `Permission` stays global:
   it is a catalog of capabilities the code enforces, not something a customer configures.

2. **Identity is Platform-global; membership is per company.** `AccessAccount` carries no tenant and
   its `email` stays globally unique — one credential per person across the Platform. A separate
   membership entity links an account to a company and carries the `AccessProfile` links for that
   company. `Person` remains per company and becomes **optional** for a member: a company only
   creates a Person for a user when it also wants that user in its own registry (as an employee, for
   example). This replaces the current 1:1 between `Person` and `AccessAccount`, which cannot hold
   once one global account can enter several companies.

3. **Scoping is enforced by a Prisma Client Extension**, not by each repository remembering to
   filter. A forgotten filter in a hand-written query is a cross-company data leak, and the
   Foundation is meant to be maintained for years across dozens of modules — the guarantee has to be
   structural. The schema is designed to stay compatible with PostgreSQL Row-Level Security so RLS
   can be added later as defence in depth without reworking the model.

4. **The active company lives in the session.** The session token carries it and is reissued when
   the user switches, without a new login. No URL segment and no per-company subdomain: switching
   company must not mean leaving and re-entering the application, and the navigation catalog and
   typed `ROUTES` stay exactly as they are.

## Consequences

What follows is what this decision is **expected** to imply — not a data model and not a
specification. Each item names a place in today's code the decision reaches, so its cost is visible
now rather than discovered later. Every one of them is confirmed, adjusted or replaced in the F-12
(Companies / Multi-tenancy) specification, which is where the final data model, business rules and
flows are settled, before anything is implemented.

- **Every unique constraint in `prisma/schema.prisma` is expected to change, and each one carries a
  business rule.** `Person`'s `@@unique([document, documentType])` would become company-scoped (the
  same CNPJ can be a customer of two companies); `AccessProfile.name` likewise; and
  `AccessProfile.isDefault` would become one per company. `AccessAccount.email` stays globally
  unique — that is the point of item 2.
- **`AccessAccount.personId` (unique, required) cannot survive in its current form.** The link
  between a credential and a registry record has to move to the membership layer; exactly how is a
  question for the specification.
- **Indexes will need the tenant column first**, including the two `gin_trgm_ops` indexes backing
  `GET /api/persons?search=` — without it the search scans the whole table and filters afterwards.
- **`getEffectivePermissions` will have to resolve within the active company.** A user's profiles in
  one company grant nothing in another.
- **`assertAdminChangeAllowed` will have to become per company.** "The last active ADMIN" has to
  mean the last one *in that company*, or a company loses its administrator because another still
  has one.
- **`prisma/seed.ts` will change shape.** It upserts profiles by a globally unique `name` today;
  with profiles per company, the seeded set becomes a template applied to each provisioned company.
- **Self-registration is expected to split into two flows** — creating a new company, or joining an
  existing one by invitation. Which of them `POST /api/auth/register` becomes is part of the F-12
  specification.
- **The extension needs an explicit, guarded escape hatch** for seeding, background work and
  Platform support. That hatch is the single highest-risk surface in this design and should be
  reviewed as such.
- **Nothing outside the data layer is expected to change.** The listing engine
  (`apps/web/components/data-table/`), the navigation and permission catalogs, the design system,
  the page/form/table conventions, the API response envelope and the backend module structure are
  all untouched by this decision.

Still open, and settled in the F-12 specification rather than here: hierarchy inside a company
(head office/branch/department), whether a second level of tenancy exists (resellers with their own
customers), how a new company is provisioned and what it is seeded with, whether a Platform-level
super-admin exists and how it relates to the `ADMIN` bypass in [0004](0004-role-vs-profile.md), the
scope of `GridColumnPreference`, and the names of the company and membership entities — described
above, deliberately not named yet.
