# 0004 — Technical role vs. business profile, with an ADMIN bypass

## Context

Two different questions come up when deciding what an account can do: "is this a system
administration account" (can it manage other accounts, profiles, the permission catalog) and "what
does this person do in the business" (can they view/create/edit/delete a Person record, and later,
a Project, a Cost). Conflating them into one flat role list doesn't scale — a business needs to
define its own roles (Gerente, Financeiro, Caixa) without touching system administration, and
system administration shouldn't need a "business role" to make sense.

## Decision

Two separate mechanisms, checked by two separate route guards
(`apps/api/src/modules/auth/authorize.ts`):

- **`AccessAccount.role`** — a fixed, small enum (`ADMIN`/`USER`/`SYSTEM`). Governs
  `/api/accounts`, `/api/profiles`, `/api/permissions` via `requireRole('ADMIN')`.
- **`AccessProfile`** — an arbitrary, business-defined bundle of permissions from a sealed catalog
  (`packages/schemas/src/permissions.ts`). Governs `/api/persons` and every future business-data
  route via `requirePermission('person:view')`, resolved from the account's profile links at
  request time (`permissions.service.ts#getEffectivePermissions`) — never baked into the JWT, so a
  profile change an admin makes mid-session takes effect on the account's very next request.

`ADMIN` bypasses every `requirePermission()` check unconditionally, regardless of which profiles it
holds — it's the account that configures profiles and permissions in the first place, and a
permission system that could lock out its own administrator is a bug waiting to happen.
`GET /api/auth/me` still reports an ADMIN's real profile-derived `permissions` array (not
"everything"), because `apps/web`'s `can()` helper reads that same list and has to re-apply the
identical bypass client-side (`apps/web/lib/permissions.ts`) — otherwise an ADMIN would see UI
hidden that the API would actually let them use.

## Consequences

- Adding a new permission is: add a catalog entry, re-seed, guard the route — no changes to
  `authorize.ts` or the admin UI (`docs/product/access_control.md#adding-a-new-permission`).
- There is deliberately no per-account permission override — if a permission set doesn't fit an
  existing profile, the answer is a new profile, not a one-off patch to a single account.
- The bypass lives in exactly one place (`authorize.ts`) plus its one necessary client-side mirror
  (`lib/permissions.ts#can()`) — any third place that reimplements "is this account exempt from
  permission checks" is a divergence risk and should import from one of those two instead.
