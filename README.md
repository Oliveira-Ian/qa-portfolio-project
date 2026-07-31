# Oliveira ERP — QA Portfolio Project

[![CI](https://github.com/Oliveira-Ian/qa-portfolio-project/actions/workflows/ci.yml/badge.svg)](https://github.com/Oliveira-Ian/qa-portfolio-project/actions/workflows/ci.yml)

A small, realistic mini-ERP built as a QA automation portfolio: a real database, a real HTTP API with real authentication, and a real UI to practice API and E2E testing against — no mocks, no in-memory data.

**Domain today:** authentication, a People (clients/suppliers/employees/users) registry, and full role- and profile-based access control (accounts, profiles, permissions). **Roadmap:** construction-management entities (Project, Cost, Step) connected to Person via its `CLIENT`/`SUPPLIER` types — see [`docs/product/domain.md`](docs/product/domain.md).

## Stack

- **Frontend** (`apps/web`) — Next.js (App Router, Server Components + Server Actions), React, TypeScript, Tailwind CSS, shadcn/ui, React Hook Form + Zod, TanStack Table for listings
- **Backend** (`apps/api`) — Fastify + TypeScript, feature modules (`route → controller → service → repository`)
- **Data layer** — Prisma + PostgreSQL (`prisma/schema.prisma` is the single source of truth for the data model)
- **Shared packages** — `packages/schemas` (Zod schemas/messages used by both apps), `packages/config` (base tsconfig/ESLint/Prettier)
- **Testing** — Vitest (unit) and Playwright (API + E2E, including accessibility checks via axe-core)
- **Tooling** — npm workspaces monorepo, Docker Compose for the full stack, GitHub Actions CI

## Documentation

Start at [`docs/index.md`](docs/index.md) — architecture, the Quick Start for `apps/api`, `apps/web` and the full Docker Compose stack, and the index of every other rule (design tokens, API response format, QA `data-testid` standard, business rules, domain model, access control) live there, not duplicated here.

Current state of the automated test suites (what's active, what's temporarily disabled and why): [`docs/qa/testing-status.md`](docs/qa/testing-status.md).

## License

See [`LICENSE`](LICENSE).
