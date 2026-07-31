# Docs Index — QA Portfolio / Oliveira ERP

This index exists to reduce context cost (tokens) and help you find the right rule quickly.

## If you are going to change…

- **HTML/CSS UI**:
  - Tokens (the "Olival" palette, light + dark): `docs/design/tokens.md`
  - Typography (Archivo / Inter / IBM Plex Mono): `docs/design/typography.md`
  - Auth layout (login/register): `docs/design/layouts/auth.md`
  - Dashboard layout (header/sidebar): `docs/design/layouts/dashboard.md`
  - Base components: `docs/design/components/`
  - Listing/table pattern: `docs/design/patterns/listing_pages.md`
  - Accessibility: `docs/design/accessibility.md`
- **A new listing screen** (a routine like People, Profiles, Users): the exact file tree to
  create — `docs/templates/new-routine.md`
- **API responses / auth / error handling**:
  - HTTP response standardization: `docs/api/http_responses.md`
- **QA selectors (`data-testid`)**:
  - Single source of truth: `docs/qa/testids.md`
- **System rules / domain**:
  - Project rules: `docs/product/business_rules.md`
  - Auth functional rules: `docs/product/auth_rules.md`
  - Domain: `docs/product/domain.md`
  - Access control (roles, profiles, permissions): `docs/product/access_control.md`
- **Why something is built the way it is** (not what to change, but the reasoning behind a past
  decision): `docs/adr/` — short Architecture Decision Records, e.g. why the session token never
  reaches the browser, why OpenAPI documents the API without validating it, why the navigation
  catalog's URLs are shorter than its own nesting.

## Architecture

- Frontend: Next.js (App Router, Server Components + Server Actions) + React + TypeScript + Tailwind CSS + shadcn/ui + React Hook Form/Zod (`apps/web`)
- Listings: TanStack Table (`@tanstack/react-table`) powers every listing screen's shared toolbar/grid/filters/export/column-personalization infrastructure (`apps/web/components/data-table/`) — see `docs/design/patterns/listing_pages.md`. Column show/hide + order is the one piece persisted server-side (`GridColumnPreference`, per account); everything else (sort/filter/search/pagination/selection) is client-side state.
- Backend: Fastify + TypeScript, organized by feature module (`route → controller → service → repository`) with a central error handler (`apps/api`)
- Data layer: Prisma + PostgreSQL (`prisma/schema.prisma`, single source of truth for the data model)
- Architecture: monolithic
- Shared validation: `packages/schemas` (Zod schemas and messages used by both `apps/web` and `apps/api` — including the auth message strings, so client and server never drift)
- Shared tooling: `packages/config` (base `tsconfig`, ESLint, Prettier)
- E-mail: `apps/api/src/modules/email/email.service.ts` — an `EmailService` interface and a `NoopEmailService` that logs to the console. No real provider is wired in and nothing calls it yet; it exists as the seam a future feature (welcome e-mail, password reset) sends through without the caller needing to change when a real provider is added.

### Auth and access control

Sessions are JWTs (`jose`, 8h expiry) issued by `POST /api/auth/login`, stored in an **httpOnly** cookie by a Server Action — never in `localStorage`, never read by client JavaScript. `apps/web/proxy.ts` (Next 16's renamed convention for `middleware.ts`) redirects unauthenticated visits to `(dashboard)` routes to `/login`; `apps/web/lib/session.ts#requireSession()` in each `layout.tsx` is the actual check. A well-formed cookie whose token the API no longer honors (expired, or the account was deactivated) is routed through `apps/web/app/api/session/expire/route.ts` — the one place outside sign-out that clears the cookie — rather than surfacing a raw "Unauthorized" error.

Every `/api/*` route except `/api/auth/*` requires `Authorization: Bearer <token>`. Business-data routes (`/api/persons/*`) require a specific business permission (`requirePermission('person:view')`, …); system-administration routes (`/api/profiles`, `/api/permissions`, `/api/accounts`) require the technical role `ADMIN` (`requireRole('ADMIN')`), which also bypasses permission checks. Passwords are bcrypt-hashed (`apps/api/src/modules/auth/password.ts`). Full model: `docs/product/access_control.md`.

`apps/web` has: the auth pages (`/login`, `/register`), a public landing page (`/`) and the design-system reference (`/styleguide`), and the dashboard — `/home` (always accessible) plus every business screen nested under a Module/Group/Category/Routine path from `apps/web/lib/navigation/catalog.ts`:

- People CRUD: `/records/people/people`, `.../new`, `.../[id]`, `.../[id]/edit` (the edit/view pages also carry the conditional Access Account section for `USER`-typed people).
- Profiles CRUD: `/administration/access-control/profiles`, `.../new`, `.../[id]/edit`.
- Access Control (accounts): `/administration/access-control/users` — list accounts, toggle active, change role, manage profile links.

Every one of these hrefs is a typed reference into `apps/web/lib/navigation/routes.ts#ROUTES`
(derived from the catalog's Module/Group/Routine slugs — Category stays part of the catalog and the
breadcrumb, but isn't a URL segment) rather than hand-typed at each call site.

The old flat paths (`/people`, `/profiles`, `/users`) still work, as do the first nested paths this migration used (with a repeated Category segment, e.g. `/cadastros/pessoas/cadastros/pessoas`) and the Portuguese paths the catalog used before the project's Language Standard translated it to English (e.g. `/cadastros/pessoas/pessoas`) — `next.config.ts` permanently redirects every era to today's paths. The sidebar, breadcrumb and global search (`Ctrl+Shift+F`) are all driven by the same catalog, and every page/Server Action reference is a typed `ROUTES.*` value (`apps/web/lib/navigation/routes.ts`) rather than a hand-typed string — nothing hardcodes a nav item or a URL outside those two places. Full layout: `docs/design/layouts/dashboard.md`.

## Quick Start (apps/api)

Requires a local PostgreSQL instance (e.g. `docker run -d -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=oliveira_erp -p 5432:5432 postgres:16-alpine`). Copy `prisma/.env.example` to `prisma/.env` and `apps/api/.env.example` to `apps/api/.env`, adjusting `DATABASE_URL` if needed. Set `JWT_SECRET` in `apps/api/.env` for anything beyond local dev (a dev-only default is used otherwise, and boot fails if that default is still set with `NODE_ENV=production`). Set `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `prisma/.env` to bootstrap the first admin account — without them, `db:seed` still seeds the permission catalog and default profiles, just no admin.

```bash
npm install
npm run build -w packages/schemas   # compiles the shared Zod schemas apps/api imports at runtime
npm run db:migrate                  # applies prisma/migrations against your local Postgres
npm run db:seed                     # permission catalog, default profiles, and the first admin
npm run dev:api                     # starts apps/api on http://localhost:3000
```

`packages/schemas` isn't watched automatically — re-run `npm run build -w packages/schemas` whenever you change it, or `apps/api`/`apps/web` keep using the previously-compiled version.

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
