# Manual validation and open decisions — Platform and ERP stabilization

Written 2026-10-11, after a stabilization pass over the Platform and the ERP (no new automated tests
by decision — `docs/qa/testing-status.md` says why). It records three things so none of them lives
only in someone's head: what was exercised and how, what still has to be checked by a person, and the
decisions that were deliberately **not** taken.

A screen opening is not validation. Everything under "Exercised" was driven end to end — through the
UI in a real browser, against the real API and database — and the persistence was read back.

## Exercised, and what it found

| Area | What was driven | Result |
|---|---|---|
| Route protection | Every protected URL without a cookie (12 routes); every protected API route without a token (6) | All `307 → /login?next=…` and `401` |
| Sign in | Empty, malformed e-mail, wrong password, success; `?next=` honoured | **`?next=//host` left the site after signing in** — fixed (`lib/navigation/safe-path.ts`) |
| Session | Cookie flags; a corrupted token; a non-JSON cookie; opening `/login` while signed in; sign out; the token going stale **with a form open** | Flags are right (httpOnly, SameSite=Lax, 8 h). Stale token on a form only toasted "Unauthorized" and left the user stuck — fixed: any `401` to a request that sent a token ends the session |
| Create account | Empty, bad e-mail, success, then sign in and the "no company" states of Home, `/erp`, `/company` | **A birth date like `abc` answered 500** — fixed. Guard states are correct |
| People (UI + API) | Create, view, edit (read back after reload), delete (cancel and confirm), search, type tabs, sort, page, filter drawer and column filter, "Clear all", customize columns (saved, reloaded, restored), export | **A duplicate document answered 500** (create and update) — fixed to 409 with the message on the Document field. **Search or filter with no match said "The registry is empty… Add the first person"** — fixed. **Export wrote only the 10 rows of the page, silently** — the dialog now says so (full export is a decision, below) |
| Profiles | Create, edit (permissions read back), delete, duplicate name | **Duplicate name, repeated or unknown permission ids and `GET /api/profiles/abc` answered 500** — fixed |
| Users | Link and unlink a profile (persisted), role and status controls as a non-super-admin and as one | **Role and status looked editable to anyone but only a `SUPER_ADMIN` may change them** (`403` otherwise) — now offered only to one |
| Company administration | Home strip, `/company`, members, product access (smoke) | Loads and lists correctly; the mutations were exercised in the previous pass (`docs/design/layouts/platform.md`) |
| Console and network | Every route above, dev and production build | No app errors. `/favicon.ico` answered 404 — fixed |
| Speed | Warm and first-visit timings, dev and production build | See below |

### Speed

- **Production build:** every screen loads in 80–150 ms (TTFB 25–80 ms), the `[id]` screens included.
- **`next dev`, warm:** 100–300 ms server time. **`next dev`, first visit to a route:** 0.5–3.5 s, and
  6–9 s for the first page after a restart — that is Turbopack compiling, not application code.
- **A `next dev` left running for ~27 h started answering `500` on every `[id]` route**
  ("Jest worker encountered 2 child process exceptions"). It was the dev server's worker, not the
  code: a restart cleared it, and the production build serves the same routes fine. If a dev server
  starts behaving oddly, `npm run dev:doctor`, restart it, and check against a production build
  before suspecting the code.

### Automated checks run (existing ones only)

`npm run typecheck`, `npm run lint` (one old TanStack Table warning), `npm run format`,
`npm run test:unit` (26), `npm run build -w apps/web` (21 routes), `tests/e2e/auth.spec.ts` and the
login/register cases of `a11y.spec.ts` (5), `tests/api/auth.spec.ts` (5). **People, Profiles and
Users have no active automated test** (`tests/api/person.spec.ts`, `tests/e2e/people.spec.ts` are
`fixme`) — the table above is their only validation.

## Still needs a person

- **Browser password manager on Sign in.** The fields carry `autocomplete="username"` and
  `current-password`; whether a given manager offers to save and fill is not something to script.
- **A real phone, not an emulated width.** The People form's sticky Cancel/Save bar and the type chips at
  44 px, with the on-screen keyboard open (iOS Safari resizes the viewport differently from Chromium).
- **A screen-reader pass over the new People form** — the type chips are a group of `aria-pressed`
  buttons, errors are announced through `FormMessage`, the error summary says how many fields to check.
- **Export opened in Excel.** The CSV now starts with a UTF-8 byte-order mark so Excel reads accented
  names (`Construção`) correctly — it was added without Excel at hand, so open one file and confirm.
- **Two tabs.** Signing out in one leaves the other showing stale data until its next request, which then
  ends its session; check that nothing sensitive stays readable.
- **The language switch (EN | PT) on the new strings** — the "No results" state, the Export note, the
  duplicate-document and duplicate-name messages, the sign-in copy.
- **A session that really lasts 8 h.** The expiry path was driven by corrupting the token, not by waiting.

## Decisions waiting — nothing here was changed

| Decision | Evidence | Recommendation |
|---|---|---|
| **Password policy** | Sign up accepts a one-character password (`auth_rules.md`: "any non-empty password") | A minimum of 8 characters on the API and the form; change the documented messages with it |
| **How strictly to validate a person** | The API accepted a CPF `111.111.111-11` (only the digit count is checked), a birth date in 2999, a phone `abc`, a zip `xx`, a state `ZZ`, a 20,000-character name | CPF/CNPJ check digits, no future birth date, a UF from the list, phone and zip patterns, and maximum lengths. Check existing records first — an edit of a record with a placeholder document would start failing |
| **Forgot password** | No mail provider (`NoopEmailService` only logs) and no reset token | Needs a provider, a token model with a migration, and an ADR. Until then the screen says it isn't available and nothing pretends otherwise |
| **What "Remember" means** | It only remembers the e-mail; the session is always 8 h | Keep it as is (the label now says so), or add a longer session behind it — a security trade-off |
| **Exporting every matching row** | The CSV holds the page on screen, because lists paginate on the server | A server-side export (page through the filtered result or stream it) with a ceiling |
| **Signing out does not revoke the token** | The JWT is stateless; a copied token stays valid until it expires (8 h) | Acceptable for now; shorter tokens with refresh, or a deny-list, if that stops being acceptable |
| **`/styleguide` is public** | It is outside the protected prefixes | Fine for a portfolio; gate it or drop it from a production build otherwise |
| **Test data piles up** | Every e2e and API run leaves `qa-*` accounts and people behind | A cleanup step in the future test phase |
| **No success toast after create or update** | Those actions redirect, so the component that would show it is gone | Pass a flash message through the redirect |
| **No "unsaved changes" guard** | Cancel and the browser's back button drop what was typed | Worth adding now that the form is one long page |
