# Testing Status

What's active, what's disabled, and why — so a red run or a skipped spec never has to be
re-diagnosed from scratch. This is a status snapshot, not a test plan; it should shrink as specs get
fixed and disappear once the full testing-strategy phase lands (see "What the future phase needs to
build" below).

## Active

- `tests/unit/*.test.ts` (Vitest) — pure logic, no auth/UI drift possible. Healthy.
- `tests/api/auth.spec.ts` — matches the current `/api/auth/*` contract (messages, status codes).
- `tests/e2e/auth.spec.ts` — matches the current login/register UI (testids, redirect targets).
- `tests/unit/observability.test.ts` (Vitest) — the `x-trace-id` header names the trace the request
  was recorded in, and the API's log lines carry no query string, client address or credential. No
  collector or database needed.

### Investigating a failed test with the trace

Every API response carries an `x-trace-id` header, and the API and the web app push their telemetry
to the optional local Grafana stack (`npm run obs:up`; `docs/operations/observability.md`). No spec
is changed for this. A red run is followed from the assertion to its evidence:

1. **API test:** the failing request's response headers hold the trace id (`curl -i` the same call,
   or read `response.headers()['x-trace-id']` in a scratch run). Paste it into Grafana > Explore >
   Tempo for the trace, and into Loki (`{service_name="oliveira-api"} | trace_id="…"`) for the lines.
2. **E2E test:** the browser only talks to the web app, whose responses have no trace id. Search
   Tempo for the route and the time of the failure instead
   (`{ resource.service.name = "oliveira-web" && name =~ "GET /records.*" }` in the run's time
   window); the trace shows the page, its `fetch` calls to the API and the queries behind them.
3. **Was it isolated?** The "Oliveira API - Overview" dashboard shows whether the same route also had
   errors or a latency spike around that moment.

### What the active specs need in CI

The specs are healthy, but two of them depend on setup that `.github/workflows/ci.yml` has to do
explicitly — a red run that mentions either is a missing CI step, not a broken spec:

- **A built `packages/schemas`** (`unit-tests`, `api-tests`, `e2e-tests`). `@oliveira/schemas`
  resolves to `dist/`, so `tests/unit/email.test.ts` fails to import it on a clean checkout.
- **A seeded database** (`e2e-tests`). `tests/e2e/auth.spec.ts` registers a user and lands on
  `/home`, which calls `GET /api/persons/summary` and needs `person:view`. A self-registered user
  only gets it from the seeded `isDefault` profile (`docs/product/access_control.md`), so without
  `npm run db:seed` the API answers `403` and the home page never renders. `tests/api` does not
  need the seed: it only calls the public `/api/auth/*` routes.

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
6. A Playwright fixture that attaches the `x-trace-id` of every API response to the test report, so
   step 1 above needs no manual reproduction. Kept out of this phase on purpose: it changes how
   every spec gets its `request`.
7. Once `apps/api/src/utils/email.ts` no longer needs to exist as a back-compat re-export (see the
   evolution plan's backend cleanup phase), move `tests/unit/email.test.ts`'s import to
   `@oliveira/schemas` directly.
