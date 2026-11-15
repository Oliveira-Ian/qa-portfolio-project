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
| **Public demo** | a database of its own, on the demo host | `npm run db:seed:demo` | daily: `npm run db:reset:demo` |

The isolation tests never touch `oliveira_erp`: their global setup refuses to recreate a database
whose name does not end in `_test`. Future automated suites (API, E2E) follow the same rule — a
database of their own with deterministic data, never the development or demo one.

## The public demo

The portfolio's demo is the product itself, run against a fictional company — **Oliveira Demo
Services** — with a month of field service: two branches, a manager and three technicians, twelve
customers with their sites and contacts, eighteen pieces of equipment, a catalog and thirty work
orders in every status, with their materials and history. Dates are relative to the day the seed
runs, so the dashboard always shows something scheduled today, overdue and recently completed.

| Piece | Where | What it does |
|---|---|---|
| `prisma/demo-seed.ts` | `npm run db:seed:demo` | Creates the demo company (refuses if it exists). Fixed ids, the same data every run. Only the demo company and the `@demo.oliveira.app` accounts are ever written. |
| | `npm run db:reset:demo` | Deletes the demo company and its accounts, then seeds it again. Refuses to run unless `DEMO_DATABASE_NAME` is the name of the database it is connected to. |
| `DEMO_LOGIN_EMAIL` / `DEMO_LOGIN_PASSWORD` | `prisma/.env` and the web | The demo account. The other members get random passwords nobody knows. |
| `DEMO_MODE=true` | the web | The login page shows the demo credentials and a button that fills them in. |
| `DEMO_ACCOUNT_EMAIL` | the API | Nobody can change the demo account's role, status, seats or profiles, nor edit or delete the profiles it holds — one visitor can't lock the next one out. Everything else is free to use. |
| `PUBLIC_REGISTRATION_ENABLED` | the API and the web | Off by default everywhere: `/register` and `POST /api/auth/register` are not found. Companies add their own members. |

**Still to do when the demo host exists:** the scheduled job that runs `npm run db:reset:demo` once a
day (a GitHub Actions schedule or the host's cron) and the host itself. Images are published only by
`.github/workflows/release.yml`; the reset job uses the published image, it does not build one.

The demo can also be tried locally, in its own company inside the development database:
`npm run db:seed:demo` with `DEMO_LOGIN_PASSWORD` set, then the web with `DEMO_MODE=true` and the
API with `DEMO_ACCOUNT_EMAIL`. `db:reset:demo` locally needs `DEMO_DATABASE_NAME=oliveira_erp`.

A database per company is not used. It remains possible later: every row carries its company and
every connection is made in one place (`apps/api/src/config/prisma.ts`).
