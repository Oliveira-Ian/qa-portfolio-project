# Business Rules — QA Portfolio / Oliveira ERP

Project rules that must be followed to keep the system consistent, “real”, and testable.

## Goal

- A **testable** system that is close to real-world behavior
- Evolve into a mini-ERP (e.g. construction), starting with **authentication** and the system foundation

## Core rules (non-negotiable)

- **No mocks** and no in-memory arrays for domain data
- **All database operations must use Prisma Client**
- `schema.prisma` is the **single source of truth**
- Keep code **simple, organized, and testable**
- Avoid overengineering

## Data and persistence

- Real database (SQLite first; future migration to PostgreSQL)
- Migrations via Prisma

## QA focus

- API tests with a real database
- E2E flows (login, CRUD)
- Predictable/resettable data; simple setup/teardown

