# Docs Index — QA Portfolio / Oliveira ERP

This index exists to reduce context cost (tokens) and help you find the right rule quickly.

## If you are going to change…

- **Anything at all** — how work is planned, branched, reviewed, verified and merged, and what an
  Epic, a Feature and a Task each mean: `docs/process/development-workflow.md`. `CONTRIBUTING.md` is
  the short entry point; the reasoning behind the model is `docs/adr/0009`.
- **Versions, releases, hotfixes, Docker images**: `docs/process/versioning.md` (reasoning:
  `docs/adr/0010`).
- **HTML/CSS UI**:
  - Tokens (the Oliveira palette and the three product accents; light only): `docs/design/tokens.md`
  - Typography (Archivo / JetBrains Mono): `docs/design/typography.md`
  - Auth layout (sign in / create account): `docs/design/layouts/auth.md`
  - The shell (global bar / sidebar / breadcrumb / guard states): `docs/design/layouts/dashboard.md`
  - The Platform (Home, company, members, product access): `docs/design/layouts/platform.md`
  - Interface language (adding a message, a language, translating API messages): `docs/design/i18n.md`
  - Base components: `docs/design/components/`
  - Listing/table pattern: `docs/design/patterns/listing_pages.md`
  - Accessibility: `docs/design/accessibility.md`
- **A new listing screen** (a routine like People, Profiles, Users): the exact file tree to
  create — `docs/templates/new-routine.md`
- **API responses / auth / error handling**:
  - HTTP response standardization: `docs/api/http_responses.md`
- **QA selectors (`data-testid`)**:
  - Single source of truth: `docs/qa/testids.md`
- **Logs, metrics, traces, dashboards, alerts** (adding a metric or a span, investigating a failure
  by its trace id): `docs/operations/observability.md` (reasoning: `docs/adr/0017`).
- **System rules / domain**:
  - Project rules: `docs/product/business_rules.md`
  - Auth functional rules: `docs/product/auth_rules.md`
  - Domain: `docs/product/domain.md`
  - Access control (roles, companies, product seats, profiles, permissions): `docs/product/access_control.md`
  - Platform access model (data, API, access matrix): `docs/especificacoes/platform-access-model.md`
- **Why something is built the way it is** (not what to change, but the reasoning behind a past
  decision): `docs/adr/` — short Architecture Decision Records, e.g. why the session token never
  reaches the browser, why OpenAPI documents the API without validating it, why the navigation
  catalog's URLs are shorter than its own nesting.

## Architecture

- Frontend: Next.js (App Router, Server Components + Server Actions) + React + TypeScript + Tailwind CSS + shadcn/ui + React Hook Form/Zod (`apps/web`)
- Listings: TanStack Table (`@tanstack/react-table`) powers every listing screen's shared toolbar/grid/filters/export/column-personalization infrastructure (`apps/web/components/data-table/`) — see `docs/design/patterns/listing_pages.md`. Column show/hide + order is the one piece persisted server-side (`GridColumnPreference`, per account); everything else (sort/filter/search/pagination/selection) is client-side state.
- Backend: Fastify + TypeScript, organized by feature module (`route → controller → service → repository`) with a central error handler (`apps/api`). Who is calling reaches the repository layer through a per-request context (`apps/api/src/shared/request-context.ts`, opened in `preValidation`, filled by `requireAuth`): `docs/adr/0016-request-context.md`, spec in `docs/especificacoes/request-context.md`
- Data layer: Prisma + PostgreSQL (`prisma/schema.prisma`, single source of truth for the data model)
- Architecture: modular monolith — the Platform (the central system: sign-in, one identity, home) over a shared Foundation, with one product at a time entered from it (Oliveira FSM first) as an area of the same web app and session. Dependencies point only from a product to the Foundation: `docs/adr/0011-platform-shape.md`, `docs/adr/0015-platform-portal-and-central-identity.md`. The Foundation/product folder split is not made yet; today's `apps/api/src/modules/*` are still one flat list.
- Shared validation: `packages/schemas` (Zod schemas and messages used by both `apps/web` and `apps/api` — including the auth message strings, so client and server never drift)
- Shared tooling: `packages/config` (base `tsconfig`, ESLint, Prettier)
- Observability: OpenTelemetry in `apps/api` (logs, metrics, traces — `apps/api/src/instrumentation.ts`, preloaded with `node --import`) and `apps/web` (traces, `apps/web/instrumentation.ts`), pushed over OTLP to a single optional `grafana/otel-lgtm` container (`docker-compose.yml`, profile `observability`). Local development and testing only. Every API response carries an `x-trace-id` header. `docs/operations/observability.md`, `docs/adr/0017`.
- E-mail: `apps/api/src/modules/email/email.service.ts` — an `EmailService` interface and a `NoopEmailService` that logs to the console. No real provider is wired in and nothing calls it yet; it exists as the seam a future feature (welcome e-mail, password reset) sends through without the caller needing to change when a real provider is added.

### Auth and access control

Sessions are JWTs (`jose`, 8h expiry) issued by `POST /api/auth/login`, stored in an **httpOnly** cookie by a Server Action — never in `localStorage`, never read by client JavaScript. `apps/web/proxy.ts` (Next 16's renamed convention for `middleware.ts`) redirects unauthenticated visits to `/home`, `/company`, `/erp` and `/fsm` to `/login`; `apps/web/lib/session.ts#requireSession()` in each `layout.tsx` is the actual check. A well-formed cookie whose token the API no longer honors (expired, or the account was deactivated) is routed through `apps/web/app/api/session/expire/route.ts` — the one place outside sign-out that clears the cookie — rather than surfacing a raw "Unauthorized" error.

Every `/api/*` route except `/api/auth/login`, `/api/auth/register` and `/health` requires `Authorization: Bearer <token>`. Authorization has four layers, none of which grants anything in the next (`docs/adr/0018`): the account's role on the Platform (`SUPER_ADMIN`, `requireRole`), its membership in a company (`requireCompanyAdmin`), a seat in a product its company contracted (`requireProductAccess('ERP')`, before every ERP route), and the product's own permissions (`requirePermission('person:view')`, …, granted by profiles — no role is exempt). The token proves identity only: `requireAuth` reads the account's existence, `active` flag and `role`, and its company, contracts and seats, from the database on every request, so a deactivation, a demotion or a revoked seat applies immediately. Passwords are bcrypt-hashed (`apps/api/src/modules/auth/password.ts`). Full model: `docs/product/access_control.md`; specification: `docs/especificacoes/platform-access-model.md`.

`apps/web` is organised in **areas** (`docs/adr/0019`), each with its own layout and its own guard:

- the **auth** pages (`/login`, `/register`) and the design-system reference (`/styleguide`); `/` redirects to `/home` or `/login`;
- the **Platform** (`app/(platform)/`): `/home` — always accessible: the products the company uses and the user's access to each — and, for a company admin, `/company`, `/company/members` (and `/company/members/:id`) and `/company/product-access` (`docs/design/layouts/platform.md`);
- **Oliveira ERP** (`app/erp/`, behind an ERP seat — without one the user sees the global bar and an explanation): `/erp` (the overview) plus every business screen nested under a Module/Group/Routine path from `apps/web/lib/navigation/catalog.ts`:
  - People CRUD: `/erp/records/people/people`, `.../new`, `.../[id]`, `.../[id]/edit` (the edit/view pages also carry the conditional Access Account section for `USER`-typed people).
  - Profiles CRUD: `/erp/administration/access-control/profiles`, `.../new`, `.../[id]/edit`.
  - Access Control (accounts): `/erp/administration/access-control/users` — list accounts, toggle active, change role, manage profile links.
- **Oliveira FSM** (`/fsm`): a "coming soon" placeholder.

Every one of these hrefs is a typed reference into `apps/web/lib/navigation/routes.ts#ROUTES`
(derived from the catalog's Module/Group/Routine slugs — Category stays part of the catalog and the
breadcrumb, but isn't a URL segment) rather than hand-typed at each call site.

The ERP's URLs used to live at the root: `/records/...` and `/administration/...` (and, before them, the flat `/people`, `/profiles`, `/users`, the first nested paths with a repeated Category segment, and the Portuguese paths the catalog used before the project's Language Standard translated it to English) — `next.config.ts` permanently redirects every era to today's `/erp/...` paths. The sidebar, breadcrumb and global search (`Ctrl+Shift+F`) are all driven by the same catalog, and every page/Server Action reference is a typed `ROUTES.*` value — nothing hardcodes a nav item or a URL outside those two places. The interface is available in English and Brazilian Portuguese (`docs/design/i18n.md`). Full layout: `docs/design/layouts/dashboard.md`.

## Quick Start (apps/api)

Requires Node 22.18 or newer (Prisma 7) and a local PostgreSQL instance (e.g. `docker run -d -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=oliveira_erp -p 5432:5432 postgres:16-alpine`). Copy `prisma/.env.example` to `prisma/.env` and `apps/api/.env.example` to `apps/api/.env`, adjusting `DATABASE_URL` if needed. Set `JWT_SECRET` in `apps/api/.env` for anything beyond local dev (a dev-only default is used otherwise, and boot fails if that default is still set with `NODE_ENV=production`). Set `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `prisma/.env` to bootstrap the first administrator — a `SUPER_ADMIN` that is also the test company's administrator, with seats in both products and the ERP's Administrator profile (each layer granted explicitly; none implies another). Without them, `db:seed` still seeds the permission catalog, the default profiles and the test company with its contracts, just no administrator. `SEED_TEST_ACCOUNTS=true` with `SEED_TEST_PASSWORD` also creates one account per row of the access matrix (`docs/especificacoes/platform-access-model.md`) — for trying the model by hand only.

```bash
npm install
npm run build -w packages/schemas   # compiles the shared Zod schemas apps/api imports at runtime
npm run db:generate                 # writes the Prisma client to apps/api/src/generated (git-ignored)
npm run db:migrate                  # applies prisma/migrations against your local Postgres
npm run db:seed                     # permission catalog, default profiles, and the first admin
npm run dev:api                     # starts apps/api on http://localhost:3000
```

`packages/schemas` isn't watched automatically — re-run `npm run build -w packages/schemas` whenever you change it, or `apps/api`/`apps/web` keep using the previously-compiled version.

Prisma 7 no longer does two things on its own: `db:migrate` neither regenerates the client nor runs the seed. Re-run `npm run db:generate` after every schema change (and after a fresh clone), and `npm run db:seed` whenever you want the seed. The Prisma CLI reads `prisma/.env` through `prisma.config.ts` (which also holds the seed command); the API and the seed talk to Postgres through the `pg` driver adapter (`apps/api/src/config/prisma.ts`). Two transitive dependencies of the Prisma CLI are forced to patched versions through `overrides` in the root `package.json` (`deepmerge-ts` 8, `mysql2` 3.22+) because Prisma 7.10 pins vulnerable exact versions; drop the overrides once a Prisma release ships fixed ones.

Interactive API docs (Swagger UI, generated from the same Zod schemas): `http://localhost:3000/docs` (raw OpenAPI JSON at `/docs/json`). Documents request shapes only — see `docs/api/http_responses.md` for the exact response envelope and error messages, which the generated spec doesn't capture.

```bash
npm run lint
npm run typecheck
npm run test:unit       # Vitest — pure logic, no database needed
npm run test:api        # Playwright — starts apps/api and hits it over HTTP, needs a real Postgres
```

## Quick Start (apps/web)

`apps/web` and `apps/api` both default to port 3000. To run them together (needed for anything that calls the API — auth, dashboard, people), start `apps/api` on a different port:

```bash
npm install
PORT=3001 npm run dev -w apps/api   # http://localhost:3001
npm run dev -w apps/web             # http://localhost:3000
```

`apps/web`'s Server Actions and data-access layer call the API from the server (`apps/web/lib/api/client.ts`), defaulting to `http://localhost:3001`; override with `API_URL` in `apps/web/.env.local` if you run `apps/api` on a different port. Unlike the previous version, the API address is never exposed to the browser.

```bash
npm run build -w apps/web   # production build — also catches theme/CSS mistakes lint/typecheck don't
npm run test:e2e            # Playwright, headed — starts both servers; auth, dashboard, people, accessibility
```

## Quick Start (Docker Compose — full stack)

For **manually clicking through the whole system** (not for active coding — no hot-reload, rebuild the image after each code change):

```bash
npm run docker:up     # builds + starts postgres, api and web
```

- Web: `http://localhost:3000`
- API: `http://localhost:3001`

`postgres`, `api` and `web` each run in their own container on the Compose network; migrations apply automatically when the `api` container starts (`apps/api/Dockerfile`'s entrypoint runs `prisma migrate deploy`). Stop everything with `npm run docker:down`.

If you've been following the apps/api Quick Start above and have its standalone Postgres container running (`docker run ... postgres:16-alpine`), stop it first (`docker stop <container>`) — it binds the same host port 5432 as Compose's own `postgres` service, and both can't listen at once.

For active development, keep using `npm run dev -w apps/api` / `npm run dev -w apps/web` natively (fast hot-reload) — Compose is for testing the built system end-to-end, and for CI to verify the images actually build and boot (`.github/workflows/ci.yml`, `docker-build` job).

## Quick Start (observability — optional)

```bash
npm run obs:up     # starts one container: collector + Loki + Tempo + Prometheus + Grafana
npm run obs:down   # stops it; the data stays in a volume
```

Grafana is at `http://localhost:3002` (no login; the port is published on `127.0.0.1` only). The API and the web app, run natively or in Compose, push their telemetry to it on their own — start them as usual. Nothing else depends on this container: without it the apps run the same. Everything else — how to find a request by its `x-trace-id`, the dashboard, the alerts, adding a metric — is in `docs/operations/observability.md`.
