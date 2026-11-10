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
`AsyncLocalStorage` ([0016](0016-request-context.md)), whose company comes from the session
**validated against the caller's membership in the database** on each request (the token proves
identity only).

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
- **The company is read from the request context inside the extension.** That an extension callback
  sees the calling request's context, even for batched `findUnique` calls, was measured on Prisma 7.10
  ([0016](0016-request-context.md)). What the spike still has to prove is the wrapper around each
  operation — `set_config` plus the query in one transaction — and interactive transactions: that two
  concurrent requests for different companies never see each other's rows, over the connection pool.
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

## Spike results and what was built (2026-11-10, #60)

The spike ran against PostgreSQL 16 with Prisma 7.10 and `@prisma/adapter-pg` (two companies, 50,000
rows each, a pool of 10). Every direction above held; nothing in the design changed.

| Direction | Result |
|---|---|
| Transaction-local `set_config` + query in one batch transaction | Works; the setting never outlives it. On a single pooled connection, after a successful and a failed transaction, `current_setting` is `''` and the table reads as empty. |
| Fail closed | No setting (or `''`) matches no row; an insert is refused by `WITH CHECK`. |
| Interactive unit of work | Works when the operations run on the transaction's own client with the setting applied once; the extension skips its per-operation wrap while a flag in the request context says it is inside one. A bare `prisma.$transaction` would put each operation on another connection — forbidden by an ESLint rule. |
| Concurrency | 400 interleaved requests of both companies, some in interactive transactions with random delays: 8,000 rows checked, no leak. |
| Database layer alone | Raw SQL and an unextended client as the application role see nothing without the setting, and only their own company with it; a cross-company insert fails. |
| Application role cannot turn it off | `DISABLE`/`NO FORCE ROW LEVEL SECURITY` and `DROP POLICY` fail (not the owner); `SET row_security = off` errors; no `SUPERUSER`/`BYPASSRLS`. |
| Composite foreign keys `(companyId, id)` | Refuse a cross-company reference even for the `BYPASSRLS` role. |
| Cost | ~2.6 ms per `findUnique` with the wrap against ~1.0 ms without, locally: two extra statements in the same round of the batch. |
| Trigram search | **Not index-assisted under the policy.** `ILIKE` (`texticlike`) is not leakproof, so the planner cannot use the GIN index before the policy and falls back to a scan of the company's rows (24 ms on 100k rows, against 10 ms without RLS). Marking the function `LEAKPROOF` restores the index but changes a system function for the whole cluster and needs a superuser, which a managed database may not allow — not done. Searches stay correct; revisit if a single company's table grows large enough to matter. |

Also found: a Prisma query promise only starts when awaited, so the request context must be open
where it is awaited, not only where it is created ([0016](0016-request-context.md) already says so).

**Built in `feat/60-tenant-isolation`:** roles `oliveira_app` / `oliveira_admin` created by
`prisma/setup-roles.ts` (`npm run db:roles`) from the connection strings themselves; three URLs
(`MIGRATION_DATABASE_URL`, `DATABASE_URL`, `ADMIN_DATABASE_URL`); the extension and
`withTransaction` in `apps/api/src/config/prisma.ts`, the scoping rules in `config/tenant-scope.ts`;
the API refuses to boot on a role that bypasses RLS; `Person` is the first company-scoped table
(migration `20261110120000_tenant_isolation`). The required tests are `tests/isolation/`
(`npm run test:isolation`, a CI job), including the check that every table with a `companyId` column
has a forced `company_isolation` policy and agrees with `TENANT_MODELS`.

**Still open:** the narrower policies for the identity tables (`Membership`, `CompanyProduct`,
`ProductAccess`, `AccessAccount`) — they are filtered explicitly in their repositories for now — and
switching the active company (there is none to switch yet). A database per company remains possible
later: every row carries its company and every connection is made in one place.
