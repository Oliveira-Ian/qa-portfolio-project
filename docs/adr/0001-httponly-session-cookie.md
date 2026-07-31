# 0001 — httpOnly session cookie + Server Actions, not a browser-held token

## Context

The API issues a JWT (`POST /api/auth/login`, `apps/api/src/modules/auth/token.ts`). Something on
the `apps/web` side has to hold that token between requests and attach it to every subsequent API
call. The obvious options are: keep it in client-accessible storage (`localStorage`, a readable
cookie) and call the API directly from the browser, or keep it server-side only.

## Decision

The token never reaches client JavaScript. `apps/web/app/(auth)/login/_actions/login.ts` (a Server
Action) calls the API, then `apps/web/lib/session.ts#createSession()` puts the token in an
**httpOnly** cookie alongside the session account. Every subsequent read (`apps/web/lib/api/*.ts`)
runs on the Next.js server and attaches `Authorization: Bearer <token>` itself — the browser never
sends it and can't read it. `API_URL` (the API's address) is consequently a server-only env var, not
`NEXT_PUBLIC_*`.

`proxy.ts` (Next's renamed `middleware.ts`) only checks that the cookie is *shaped* like a session —
verifying the signature would mean shipping a JWT library to the edge runtime for a check the API
already performs on every request. `lib/session.ts#requireSession()` in each protected layout is the
actual gate.

## Consequences

- No XSS payload can exfiltrate the session token — there's no JS-readable copy of it anywhere.
- Every business page, form and list read/write is server-rendered or a Server Action; there is no
  client-side `fetch` to the API at all in this app.
- A stale/expired cookie the API no longer honors needs a dedicated escape hatch
  (`apps/web/app/api/session/expire/route.ts`) because a Server Component can redirect but can't
  clear a cookie — without it, `/login` and the dashboard would bounce each other in a loop.
- This only works because `apps/web` and `apps/api` are both first-party and the browser never talks
  to the API directly. A future public API consumer (a mobile app, a partner integration) would need
  its own, different auth scheme — this decision doesn't generalize to that case.
