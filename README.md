# Oliveira ERP — QA Portfolio Project

A small, realistic mini-ERP built as a QA automation portfolio: a real database, a real HTTP API, and a real UI to practice API and E2E testing against — no mocks, no in-memory data.

Domain: starts with authentication and a People (clients/suppliers) registry, evolving toward construction-management entities (Project, Cost, Step).

## Stack

- Frontend: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui (`apps/web`)
- Backend: Fastify + TypeScript (`apps/api`)
- Data layer: Prisma + PostgreSQL
- Architecture: monolithic
- Shared validation: `packages/schemas` (Zod, used by both `apps/web` and `apps/api`)

## Documentation

Start at [`docs/index.md`](docs/index.md) — it routes to the right rule (design tokens, API response format, QA `data-testid` standard, business rules, domain model) and has the Quick Start for `apps/api`, `apps/web`, and the full Docker Compose stack.

## Quick Start

```bash
npm install
npm run build -w packages/schemas
npm run db:migrate            # needs a local PostgreSQL — see docs/index.md
PORT=3001 npm run dev -w apps/api
npm run dev -w apps/web       # http://localhost:3000
```

Or the whole stack in containers, no local Node/Postgres setup required:

```bash
npm run docker:up             # http://localhost:3000
```

See `docs/index.md` for the full Quick Start (env setup, tests, CI).

## Testing

```bash
npm run test:unit   # Vitest — pure logic
npm run test:api    # Playwright — apps/api over HTTP, needs Postgres
npm run test:e2e    # Playwright, headed — full browser flows (auth, dashboard, people, accessibility)
```

## License

See [`LICENSE`](LICENSE).
