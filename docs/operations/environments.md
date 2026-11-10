# Environments and database roles

## Database roles

Tenant isolation ([ADR 0012](../adr/0012-tenant-isolation-extension-and-rls.md)) relies on three
PostgreSQL roles, each reached through its own connection string:

| Variable | Role | Used by | Row-level security |
|---|---|---|---|
| `MIGRATION_DATABASE_URL` | owner of the tables (`postgres` locally) | `prisma migrate`, `npm run db:roles`, Prisma Studio | ignored (owner/superuser) |
| `DATABASE_URL` | `oliveira_app` | the API, and nothing else | **applies** — the API refuses to start on a role that bypasses it |
| `ADMIN_DATABASE_URL` | `oliveira_admin` (`BYPASSRLS`) | `npm run db:seed`; later company provisioning and the demo reset | bypassed |

`npm run db:roles` (`prisma/setup-roles.ts`) creates or updates the two non-owner roles **from the
user names and passwords written in `DATABASE_URL` and `ADMIN_DATABASE_URL`**, and grants them DML
on every table — including tables future migrations create (`ALTER DEFAULT PRIVILEGES`). It is
idempotent; run it on a new database and whenever a password changes.

The Prisma CLI reads `prisma/.env`; the API reads `apps/api/.env`. Both `.env.example` files list
the local defaults.

### Local setup, from scratch

```bash
docker compose up -d postgres
npm run db:generate
npx prisma migrate deploy        # as MIGRATION_DATABASE_URL
npm run db:roles                 # creates oliveira_app / oliveira_admin
npm run db:seed                  # as ADMIN_DATABASE_URL
PORT=3001 npm run dev -w apps/api
```

An existing local database from before tenant isolation needs the new variables in `prisma/.env`
and `apps/api/.env` (see the examples), then `npm run db:roles` and `npx prisma migrate deploy`.

## Rate limits behind the web server

Every API request comes from the web server, not the browser. The API therefore trusts
`X-Forwarded-For` from loopback and private networks only (`TRUST_PROXY`, Fastify's `trustProxy`),
the web server forwards the visitor's address (the last entry its own proxy appended), and the global
limit is counted per session (a hash of the token) or, without one, per visitor address. Sign-in's
stricter limit is per visitor too. Set `TRUST_PROXY` to the hosting's proxy network if it differs.

## Environments

| Environment | Database | Data | Reset |
|---|---|---|---|
| **Development** | `oliveira_erp` on the Compose Postgres | the bootstrap seed plus whatever a developer creates | by hand |
| **Isolation tests** | `oliveira_test` on the same server | created by each test file | dropped and recreated on every `npm run test:isolation` |
| **Public demo** | a database of its own, on the demo host | a deterministic demo seed | daily, back to the seed (planned) |

The isolation tests never touch `oliveira_erp`: their global setup refuses to recreate a database
whose name does not end in `_test`. Future automated suites (API, E2E) follow the same rule — a
database of their own with deterministic data, never the development or demo one.

A database per company is not used. It remains possible later: every row carries its company and
every connection is made in one place (`apps/api/src/config/prisma.ts`).
