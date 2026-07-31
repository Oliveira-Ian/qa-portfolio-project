# 0002 — `packages/schemas` as the single validation contract

## Context

`apps/api` and `apps/web` both need to validate the same shapes (a person, a login form, a profile)
and, for auth specifically, need to agree on the *exact wording* of validation error messages —
`docs/product/auth_rules.md` documents specific strings a login/register form must show. Validating
independently in each app risks the two drifting: a field required on the server but not the client,
or the same condition reporting different text in each place.

## Decision

`packages/schemas` is the one place a domain shape and its validation rules are defined, as Zod
schemas, imported by both apps. This extends past the schemas themselves to the *message strings* —
`authMessages` in `packages/schemas/src/auth.ts` is imported by both `apps/api`'s controller and
`apps/web`'s inline field errors, rather than each keeping its own copy of "Please fill in email and
password". `apps/api/src/utils/email.ts` re-exports `packages/schemas/src/email.ts`'s pattern for
the same reason — it used to be copy-pasted in three places.

Where client and server genuinely need different validation shapes for the same entity (a `<input>`
only ever holds strings; the API wants typed dates and booleans), that's two schemas
(`personFormSchema` vs. `personCreateSchema`) with an explicit conversion function between them
(`personFormValuesToPayload`) — not two independent re-implementations of the same rules.

## Consequences

- A validation rule changes in exactly one file; both apps pick it up as soon as
  `packages/schemas` is rebuilt (`npm run build -w packages/schemas` — it isn't watched
  automatically, which is the one manual step this trades for the alternative).
- `docs/api/http_responses.md`'s documented error strings are the same strings the code actually
  emits, by construction, not by discipline.
- The package has to build to plain JS before `apps/api` can import it at runtime (no live
  TS-to-TS resolution across the workspace boundary) — a `tsc` step that has to run before
  `dev:api`/`dev:web` after any schema change, not a hot-reloadable dependency.
