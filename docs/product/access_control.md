# Access Control — Oliveira ERP

How identity, credentials, and permissions fit together. `docs/product/domain.md` covers what each
entity *is*; this document covers how they interact to decide who can do what.

## The model

```
Person 1──0..1 AccessAccount 0..N──N AccessProfile N──N Permission
                    │
                    └── role: ADMIN | USER | SYSTEM
```

- **`Person`** — the identity. Everyone starts here, whether they ever get a login or not.
- **`AccessAccount`** — the credential. `email` + bcrypt `password` + `role` + `active`. At most one
  per Person (`personId` is unique).
- **`AccessProfile`** — a named bundle of permissions ("Manager", "Finance", …). An account can
  hold any number of them (`AccountProfile`, the join table); its *effective* permission set is the
  union of every profile it's linked to.
- **`Permission`** — a sealed catalog entry, `resource:action` (`person:view`, `person:create`, …),
  defined in code (`packages/schemas/src/permissions.ts`) and seeded into the database. Nothing in the
  UI can invent a permission that no route actually checks.

## Role vs. profile — two different questions

These answer different questions and are checked by different code paths:

| | `AccessAccount.role` | `AccessProfile` |
|---|---|---|
| Question it answers | "Is this a system administration account?" | "What does this person do in the business?" |
| Values | `ADMIN`, `USER`, `SYSTEM` — a fixed, small enum | However many profiles the business defines |
| Checked by | `requireRole('ADMIN')` — `apps/api/src/modules/auth/authorize.ts` | `requirePermission('person:view')` — same file |
| Governs | `/api/accounts`, `/api/profiles`, `/api/permissions` — system administration | `/api/persons` and every future business-data route |
| Editable via | `/administration/access-control/users`, ADMIN only | `/administration/access-control/profiles` (CRUD), ADMIN only |

**`ADMIN` bypasses every permission check.** It doesn't matter which profiles an ADMIN account holds —
`requirePermission()` lets it through unconditionally, because it's the account that configures
profiles and permissions in the first place; a permission system that could lock its own administrator
out would just be a bug waiting to happen. `GET /api/auth/me` still reports an ADMIN's real
profile-derived `permissions` array (not "everything"), because that list is also what `apps/web`'s
`can()` helper reads — which is why `can()` re-applies the same bypass client-side
(`apps/web/lib/permissions.ts`): otherwise an ADMIN would see UI hidden that the API would actually let
them use.

**`SYSTEM`** is reserved for integrations and background jobs. It's excluded from the role picker in
`/administration/access-control/users` (`apps/web`'s `ROLE_OPTIONS` deliberately
omits it — an admin can't hand-pick it for a person's account) and blocked from interactive login
(`auth.service.ts`) — otherwise it's just an admin account with a different name.

**Permissions never enter the JWT.** The session token carries `{ sub, personId, name, email, role }`
only. With N profiles per account, baking permissions into the token would mean they go stale the
moment an admin changes a profile mid-session. Instead, `GET /api/auth/me` resolves the effective set
at read time (`permissions.service.ts#getEffectivePermissions`), and `apps/web` calls it once per
request via React's `cache()` (`apps/web/lib/permissions.ts#getMe`).

## Self-registration vs. admin-initiated accounts

Two different paths create an `AccessAccount`, and they exist for different reasons:

**`POST /api/auth/register`** (self-registration) creates the `Person` *and* the `AccessAccount`
together, in one transaction (`accountRepository.createWithPerson`):

1. `Person { name, email, birthdate, types: ["USER"] }` — no document, no `CLIENT`/`SUPPLIER` type.
2. `AccessAccount { personId, email, password: hash, role: "USER", active: true }`.
3. Linked to whichever `AccessProfile` has `isDefault: true` ("Default User", seeded) — silently
   skipped if the database hasn't been seeded yet, so registration still succeeds with zero profiles
   rather than failing.

No document is collected and no `CLIENT` record is created — a person registering for the app is not
automatically a customer of the business the app runs for. If that Person later *is* a client, that's
a separate, deliberate step (checking `CLIENT` on their Person record, which then requires a document).

**`POST /api/accounts`** (admin-initiated, `accountRepository.createForPerson`) grants a login to a
Person who already exists in the registry — a `CLIENT` who's about to start working the front desk, an
`EMPLOYEE` who needs system access. It adds `USER` to that Person's `types` if not already present,
creates the `AccessAccount`, and links the same `isDefault` profile — everything self-registration
does, minus creating the Person. Reachable from the Person edit page's Account section
(`apps/web/components/people/account-section.tsx`) once `types` includes `USER`. This endpoint isn't
in the original phase plan's literal endpoint list for `/api/accounts` — it was added because the
Person edit page needs *some* way to create an account for an existing Person, and this is the
narrowest addition that does it.

Both paths require `ADMIN` to *view or manage* afterward — `/api/accounts` is `requireRole('ADMIN')`
end to end. Self-registration itself is public (no auth required), same as before.

## Lockout guards

`assertAdminChangeAllowed()` (`apps/api/src/modules/account/account-guards.ts`) blocks two specific
changes to `PATCH /api/accounts/:id`:

- An `ADMIN` account demoting **itself** away from `ADMIN`.
- The **last active** `ADMIN` account being deactivated or demoted, by anyone.

Both would otherwise leave the system with no account able to manage accounts, profiles, or
permissions — a state only fixable by direct database access. `SYSTEM` and inactive accounts are
excluded from login (`auth.service.ts`) regardless of role, checked before the password even.

## What's deliberately not here

- **Password reset for existing accounts.** `AccountUpdateInput` (`packages/schemas/src/access-control.ts`)
  only covers `active`/`role` — there's no admin-initiated "reset this person's password" endpoint yet.
  The Person edit page's Account section reflects this: once an account exists, it shows a read-only
  summary and a link to `/administration/access-control/users`, not a password field.
- **Per-account permission overrides.** An account's permissions are exactly the union of its
  profiles' — there's no "grant this one extra permission to this one account" escape hatch. If a
  permission set doesn't fit an existing profile, the answer is a new profile, not a per-account patch.
- **Login by `login`.** `AccessAccount.login` exists in the schema (unique, nullable) for future
  ERP-style username login, but nothing reads it yet — `email` is the only credential `/api/auth/login`
  accepts.

## Adding a new permission

1. Add the entry to `PERMISSION_CATALOG` in `packages/schemas/src/permissions.ts`
   (`{ resource: 'service-order', action: 'approve', label: 'Approve service orders' }`).
2. Re-run `npm run db:seed` — `seedPermissions()` upserts by `(resource, action)`, so this is safe to
   run against a database that already has data.
3. Guard the route: `app.addHook('preHandler', requirePermission('service-order:approve'))`, or per-route.
4. The admin UI needs no code change — the Profiles screen's permission picker
   (`/administration/access-control/profiles`) reads the live catalog from
   `GET /api/permissions` and groups by `resource` automatically.

## What would change for multi-tenant

Out of scope today (see the project's own scope notes), but the shape of the change, so it doesn't
require re-architecting the authorization engine later:

- Add `tenantId` to `Person`, `AccessAccount`, and `AccessProfile` — every row belongs to exactly one
  tenant, the same pattern already used for `id`.
- Scope `AccountProfile` (and every business-data query) by the caller's `tenantId`, resolved from the
  session the same way `role` is today — added to the JWT payload and to `SessionAccount`.
- `Permission` (the catalog) stays global — permissions describe *capabilities the code has*, not
  something a tenant configures per-installation. Profiles stay per-tenant.
- `requireRole()`/`requirePermission()` don't change: both already operate on the resolved account,
  which would simply also carry a `tenantId` by then. The only new check is "does this row's
  `tenantId` match the caller's" — added once, at the repository layer, not per-route.
