# Domain — QA Portfolio / Oliveira ERP

`prisma/schema.prisma` is the single source of truth for exact field types, constraints and indexes — this file explains what the entities mean, not their column-by-column definition.

## Current entities

### Person

The single identity record — the "Party" in the Party Role pattern used by mainstream ERPs. Every
person, company, employee or system account starts here: `id` (uuid), `name`, `types` (an array of
`PersonTypeValue` — see below), `documentType`/`document` (nullable), `active` (default `true`), plus
optional `email`, `phone`, `birthdate`, `street`, `city`, `state`, `zipCode`, `notes`, and timestamps.

**`types` is an array, not a single value** — a Person can hold more than one role at once (a company
can be both a `CLIENT` and a `SUPPLIER` on the same record, rather than needing two duplicate cadastres
with the same document). The values:

| Type | Meaning |
|---|---|
| `CLIENT` | Buys from the business. Requires a document. |
| `SUPPLIER` | Sells to the business. Requires a document. |
| `USER` | Has an `AccessAccount` — a login. No document required. |
| `EMPLOYEE` | Works for the business, independent of whether they can log in. No document required. |

`document`/`documentType` are conditionally required: only when `types` contains `CLIENT` or
`SUPPLIER` (enforced by `personCreateSchema`/`personFormSchema` in `packages/schemas`, not by a
database constraint — Postgres allows a null document on any row; the API rejects the write if the
combination is invalid before it reaches the database).

### AccessAccount

Credentials only — no cadastral data lives here, that's `Person`'s job. `id` (int), `personId`
(unique FK to `Person`), `email` (unique, the login credential — deliberately separate from
`Person.email`, a contact field that can legitimately diverge), `login` (unique, nullable, reserved
for ERP-style username login, not used for authentication yet), `password` (bcrypt hash), `active`
(default `true`), `role` (`AccountRole`: `ADMIN` | `USER` | `SYSTEM` — technical access to system
administration, not a business role), timestamps.

Replaces the legacy `User` model, which mixed identity and credentials in one table. The migration
(`prisma/migrations/20260729001500_access_account_and_identity_split`) turned every existing `User`
row into a `Person` (`types: ["USER"]`) plus an `AccessAccount`, preserving ids, password hashes and
timestamps.

### AccessProfile

A named, reusable bundle of permissions — "Gerente", "Financeiro", the seeded "Administrador". `id`
(int), `name` (unique), `description` (nullable), `isSystem` (protects a profile from deletion — the
Administrador and the self-registration default), `isDefault` (the one profile self-registration links
new accounts to; at most one row should carry this), plus its `Permission`/`AccessAccount` links.

### Permission

A sealed catalog entry — `resource`/`action` (`"person"`/`"view"`), `label` (nullable, human-readable),
`@@unique([resource, action])`. Defined in code (`packages/schemas/src/permissions.ts`) and seeded into
this table; nothing in the admin UI can create a permission that isn't also checked somewhere in code.
See `docs/product/access_control.md`.

### ProfilePermission / AccountProfile

Join tables. `ProfilePermission` attaches `Permission`s to an `AccessProfile`. `AccountProfile`
attaches `AccessProfile`s to an `AccessAccount` — an account's effective permissions are the union of
every profile it's linked to here. Both cascade-delete with their parent row.

## Authorization at a glance

Every business-data route requires a specific permission (`requirePermission('person:view')`, …),
resolved from the caller's `AccessProfile` links at request time — never baked into the session token.
System-administration routes (`/api/accounts`, `/api/profiles`, `/api/permissions`) instead require the
technical role `ADMIN` (`requireRole('ADMIN')`), which also bypasses every permission check. The full
model — role vs. profile, the two account-creation paths, lockout guards, what would change for
multi-tenant — is `docs/product/access_control.md`.

## Roadmap

The entities above are the current, real model. Where the project is headed:

- **Shape**: a shared Foundation plus one product at a time — see `docs/adr/0011-platform-shape.md`. The
  first product is Oliveira FSM (customers, service locations, work orders, assignment, basic field
  execution); it will be specified as its own Epic and is not modelled here yet.
- **Multi-tenant**: decided in `docs/adr/0008-multi-tenancy-shared-database.md` and ADRs 0012–0014
  (RLS from the start, company/membership/platform roles, UUID v7 keys), not built. The data model,
  rules and flows are settled in the F-12 specification; "What would change for multi-tenant"
  in `docs/product/access_control.md` describes the expected shape of the change.
- The construction roadmap (`Project`/Obra, `Cost`, `Step`) that earlier versions of this document
  listed is **withdrawn**: there was never code for it, and no product is planned around it now.
