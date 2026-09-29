# Business Rules — QA Portfolio / Oliveira ERP

Project rules that must be followed to keep the system consistent, “real”, and testable.

## Goal

- A **testable** system that is close to real-world behavior
- Be the base of the Oliveira Platform (`docs/adr/0011-platform-shape.md`), starting with
  **authentication** and the system foundation, and validated by a first real product (Field Service
  Management)

## Core rules (non-negotiable)

- **No mocks** and no in-memory arrays for domain data
- **All database operations must use Prisma Client**
- `schema.prisma` is the **single source of truth**
- Keep code **simple, organized, and testable**
- Avoid overengineering

## Data and persistence

- Real database — PostgreSQL (`prisma/schema.prisma`, single source of truth, used by `apps/api`)
- Migrations via Prisma

## QA focus

- API tests with a real database (`tests/api`, Playwright, against a real PostgreSQL instance — see `docs/index.md` Quick Start)
- Unit tests for pure logic (`tests/unit`, Vitest)
- E2E flows (login, CRUD) — `tests/e2e`, Playwright
- Predictable/resettable data; simple setup/teardown

