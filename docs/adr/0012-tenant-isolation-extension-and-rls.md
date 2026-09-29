# 0012 — Tenant isolation: Prisma extension plus PostgreSQL row-level security, from the start

## Context

[0008](0008-multi-tenancy-shared-database.md) chose a shared database with a company discriminator,
enforced by a Prisma Client Extension, and said RLS "can be added later as defence in depth". The
Platform is being prepared for production data from the first tenancy migration, and a leak between
companies is the failure this design must not allow. Adding RLS later would mean a second structural
migration over every table and a period in which the only barrier is application code.

## Decision

**Two independent layers, both from the first tenancy migration:**

1. **Application layer** — a Prisma Client Extension that puts the active company on every query.
2. **Database layer** — PostgreSQL row-level security policies on every company-scoped table. If the
   application layer is bypassed or has a bug, the database still returns nothing from another
   company.

The active company reaches both from the same place: the request context
([#36](https://github.com/Oliveira-Ian/qa-portfolio-project/issues/36)), carried by
`AsyncLocalStorage`, whose company comes from the session **validated against the caller's membership
in the database** on each request (the token proves identity only).

Kept deliberately small: one mechanism, no abstraction beyond a function that runs work in a company
context. It replaces the RLS-later sentence of 0008; the rest of 0008 stands.

## Direction to validate (a spike before the migration lands)

These are the design choices the evaluation points to. Each one is confirmed or corrected by a
working spike against a real database before anything is migrated.

- **Transaction-local context only.** The company is set with `set_config('app.current_company_id',
  <id>, true)` — the third argument makes it local to the transaction. A session-level `SET` is
  forbidden: with pooled connections it would leak one request's company into the next.
- **Fail closed.** A policy compares the row's company to the setting; with no setting the comparison
  is `NULL` and no row matches. Inserts take the company from the same setting.
- **Two database roles.** The role that owns the tables and runs migrations is different from the role
  the application connects with. The application role is not a superuser, does not hold `BYPASSRLS`
  and does not own the tables, and every scoped table has `ENABLE` **and `FORCE`** row-level security
  — an owner or superuser silently ignores RLS otherwise. Docker Compose, CI and the env files change
  to carry two connection strings.
- **The escape hatch is a separate role, not a setting.** Seeding, provisioning a company and
  background jobs use a distinct connection with `BYPASSRLS`, isolated in one module. A bypass
  *setting* on the same role (the pattern in Prisma's own example) means any code path that sets it
  turns isolation off; a separate credential does not. This is the highest-risk surface of the
  design and is reviewed as such (0008 already says so).
- **Some tables are not company-scoped.** `Permission` (a global catalog) and the global
  identity — the account and its memberships, which login and company switching must read *before* a
  company is chosen — need their own, narrower policies. Which tables are which is part of the F-12
  specification.
- **Per-operation vs per-unit-of-work.** Prisma's documented pattern wraps each operation in a batch
  transaction of `set_config` plus the query. Its documentation also warns that an extension calling a
  client-level method inside another transaction opens a new connection and ignores the surrounding
  transaction. Multi-statement units of work (today's `personRepository.deleteMany`, account
  creation) therefore need an explicit "run in company transaction" function. The spike decides
  which shape the extension takes and proves the existing transactional call sites still work.

## Risks accepted, with what contains them

| Risk | Containment |
|---|---|
| **Prisma is two major versions behind** (5.22 here; the current documentation is v7, where middleware was removed). RLS is built on the extension API, so the upgrade comes first. | The upgrade is its own change in Phase 1, before the tenancy migration. Its cost is confirmed against the docs then. |
| **A new table forgets its policy.** Nothing in Prisma models policies; they live as hand-written SQL in migrations. | An automated check that every table with a company column has RLS enabled and forced, run in CI. |
| **Extra round trips**: each operation becomes a small transaction. | Measured in the spike. Units of work share one transaction. |
| **Search performance**: policy predicates are evaluated before non-leakproof user conditions, which may keep the two trigram indexes on `Person` from being used. | Measured in the spike against `GET /api/persons?search=`, with indexes rebuilt company-first. |
| **Interactive transactions time out**; holding one open across `bcrypt` or an outbound call would hold a pooled connection. | Transaction boundaries wrap database work only. |
| **Raw SQL.** `$queryRaw` bypasses the extension. | RLS still applies to it (that is the point of two layers); a lint rule restricts raw SQL to approved repositories. |
| **Two roles make local setup heavier.** | One init script shared by Compose and CI. |

**Complexity, stated plainly:** this is the riskiest piece of Phase 2. It touches connection setup,
migrations, CI, and every repository, and it cannot be verified by reading code — only by tests that
exercise a real database.

## Required tests (an approved exception to the no-tests-unless-asked rule)

Automated isolation tests against a real PostgreSQL, run in CI, covering at least:

- two companies with equivalent data — none of read, update, delete or count of one is visible to the
  other, on every data route;
- **no context** — a query with no active company returns nothing and an insert fails;
- **failure paths** — a transaction that rolls back leaves no company setting behind, and an error
  thrown mid-request cannot make the next request on the same pooled connection inherit the company;
- **context switching** — concurrent requests for different companies interleaved over the same pool
  never see each other's rows, and switching the active company mid-session takes effect on the next
  request only;
- **the two layers are independent** — with the extension deliberately bypassed (raw SQL), the
  database policy alone still blocks the other company;
- **the application role cannot turn RLS off** — it cannot disable it, and does not own or bypass
  the tables;
- the CI check that every scoped table has RLS enabled and forced.

## Consequences

- Phase 2 (tenancy) starts with the spike, and the migration is not written until it passes.
- Every future table with company data gets a policy in its own migration, by rule.
- `prisma/seed.ts`, company provisioning and jobs move onto the bypass connection.
