# Docs Index — QA Portfolio / Oliveira ERP

This index exists to reduce context cost (tokens) and help you find the right rule quickly.

## If you are going to change…

- **HTML/CSS UI**:
  - Tokens: `docs/design/tokens.md`
  - Auth layout (login): `docs/design/layouts/auth.md`
  - Dashboard layout (header/sidebar): `docs/design/layouts/dashboard.md`
  - Base components: `docs/design/components/`
  - Listing/table pattern: `docs/design/patterns/listing_pages.md`
- **API responses**:
  - HTTP response standardization: `docs/api/http_responses.md`
- **QA selectors (`data-testid`)**:
  - Single source of truth: `docs/qa/testids.md`
- **System rules / domain**:
  - Project rules: `docs/product/business_rules.md`
  - Domain: `docs/product/domain.md`

## Architecture

- Frontend: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui (`apps/web`)
- Backend: Fastify + TypeScript (`apps/api`)
- Data layer: Prisma + PostgreSQL (`prisma/schema.prisma`, single source of truth for the data model)
- Architecture: monolithic
- Shared validation: `packages/schemas` (Zod schemas used by both `apps/web` and `apps/api`)
- Shared tooling: `packages/config` (base `tsconfig`, ESLint, Prettier)

`apps/web` has: the auth pages (`/login`, `/register`), the dashboard shell (`/home`, `/users`, `/people` — header, collapsible sidebar, user dropdown), and the People CRUD (`/people`, `/people/new`, `/people/[id]`, `/people/[id]/edit`). `Users` is still a placeholder — no user-management feature exists yet, only the nav entry and page shell.

## Quick Start (apps/api)

Requires a local PostgreSQL instance (e.g. `docker run -d -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=oliveira_erp -p 5432:5432 postgres:16-alpine`). Copy `prisma/.env.example` to `prisma/.env` and `apps/api/.env.example` to `apps/api/.env`, adjusting `DATABASE_URL` if needed.

```bash
npm install
npm run build -w packages/schemas   # compiles the shared Zod schemas apps/api imports at runtime
npm run db:migrate                  # applies prisma/migrations against your local Postgres
npm run dev:api                     # starts apps/api on http://localhost:3000
```

`packages/schemas` isn't watched automatically — re-run `npm run build -w packages/schemas` whenever you change it, or `apps/api`/`apps/web` keep using the previously-compiled version.

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

`apps/web`'s API calls default to `http://localhost:3001` (`apps/web/lib/api.ts`); override with `NEXT_PUBLIC_API_URL` in `apps/web/.env.local` (see `apps/web/.env.example`) if you run `apps/api` on a different port.

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
