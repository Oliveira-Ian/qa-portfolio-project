# Testing Status

What's active, what's disabled, and why — so a red run or a skipped spec never has to be
re-diagnosed from scratch. This is a status snapshot, not a test plan; it should shrink as specs get
fixed and disappear once the full testing-strategy phase lands (see "What the future phase needs to
build" below).

## Active

- `tests/unit/*.test.ts` (Vitest) — pure logic, no auth/UI drift possible. Healthy.
- `tests/api/auth.spec.ts` — matches the current `/api/auth/*` contract (messages, status codes).
- `tests/e2e/auth.spec.ts` — matches the current login/register UI (testids, redirect targets).

## Disabled (`test.fixme` / `test.describe.fixme`)

The project went through an auth phase (session-gated routes, `requireAuth`), a data-model change
(`type` → `types[]`), and a navigation-catalog rebuild (nested routes, new testids, click-only-selects
grids) after these specs were written. Nobody went back to update them. Rather than rewrite or delete
them now, each is marked `fixme` in place with a comment explaining exactly what's stale — the
structure, configs and CI job stay, and Playwright reports them as `fixme`/skipped instead of failing
the build.

| File | Why it's stale |
|---|---|
| `tests/api/person.spec.ts` | No `Authorization` header — every request now gets `401` from `requireAuth`. Payload uses `type` (singular); the schema now requires `types: string[]`. |
| `tests/e2e/people.spec.ts` | No login — `/people/*` redirects to `/login` (`proxy.ts`). Uses `person-button-edit`/`person-button-delete`; the real testids are `person-list-button-edit`/`person-list-button-delete`. Uses row `dblclick` to open a record; `DataTable` only selects on click by design (View/Edit/Delete live in the row's action menu). |
| `tests/e2e/dashboard.spec.ts` | Its own top comment ("No auth guard exists yet") is false — `/home` requires a session. Uses `dashboard-nav-people`/`dashboard-nav-users`; the catalog now emits `dashboard-nav-module`/`dashboard-nav-group`. Asserts the sidebar can move fully off-screen (`boundingBox().x < 0`); the sidebar is always at least the compact icon rail by design and never fully hides. |
| `tests/e2e/a11y.spec.ts` | Three of its five pages (`home`, `people list`, `people form (new)`) require a session; without one they silently audit `/login` instead — a false positive, not a real accessibility gate. `login`/`register` are public and stay active. |

## What the future phase needs to build

This is deliberately **not** being built now — see `docs/index.md`/the project's evolution plan for
why. When it is:

1. **API auth fixture** — a `test.extend` in `tests/api/` that logs in as the seeded admin once and
   hands every test a `request` context with `Authorization` already attached.
2. **E2E auth fixture** — a `globalSetup` that logs in once and reuses a Playwright `storageState`,
   instead of each spec re-doing the login UI flow.
3. Rewrite `tests/api/person.spec.ts` against the current `types[]` payload, authenticated.
4. Rewrite `tests/e2e/people.spec.ts`/`dashboard.spec.ts` against current testids and the
   select-then-use-the-action-menu interaction model (no row `dblclick`, no `boundingBox` sign check).
5. Re-point `tests/e2e/a11y.spec.ts`'s `home`/`people list`/`people form (new)` cases through the E2E
   auth fixture so they audit the actual authenticated page.
6. Once `apps/api/src/utils/email.ts` no longer needs to exist as a back-compat re-export (see the
   evolution plan's backend cleanup phase), move `tests/unit/email.test.ts`'s import to
   `@oliveira/schemas` directly.
