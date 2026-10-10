# Design — Layouts — Auth (Sign in / Create account)

Design screens S01, S02 and M01 of the Oliveira Platform handoff.

## Structure (split screen)

- A full-viewport-height grid (`min-h-dvh`), `data-product="platform"`.
- Left, about 42%: a dark brand panel (`bg-shell`). The product lockup ("Oliveira | Platform"), the
  original raster crest (`public/brand/oliveira-logo-original.jpg`, faded into the panel with a radial
  mask — the JPEG has its own dark ground), a display headline, and a list: on **Sign in** the three
  products (Platform, ERP, FSM — each with a bar in its accent), on **Create account** the three steps
  (your account · your company · product access).
- Right: the language switch top right, the form centred, and the copyright line at the foot.

## Responsive

- `< 900px`: the panel becomes a compact dark header — the lockup, a short `EN | PT` switch and the
  headline — and the form follows immediately under it. The artwork is dropped rather than shrunk.
- Inputs are 44px on auth, at every width.

## apps/web (Next.js)

`app/(auth)/layout.tsx` is the shell; `_components/auth-panel.tsx` holds the panel and the mobile header
(client components, because they pick their copy by pathname). The two fields every auth form shares —
the email field with a leading icon, and the password field with a lock and an eye button
(`aria-pressed`) — are `_components/auth-fields.tsx`.

`login/_components/login-form.tsx` and `register/_components/register-form.tsx` are React Hook Form +
`zodResolver(loginFormSchema | registerFormSchema)` from `packages/schemas`. The inline field messages and
the API's own validation messages are deliberately worded differently for the same condition (see
`docs/product/auth_rules.md`) — both come from `authMessages` in `packages/schemas/src/auth.ts`, and both
are shown in the interface language through `translateApiMessage` (`docs/design/i18n.md`).

What the design asks for and what is **not** built, because the backend has no such thing:

- **No password-rules checklist and no terms consent.** The backend has no password policy (an empty
  password is the only refusal) and there are no Terms or Privacy pages. The footer has no Privacy / Terms
  links for the same reason. `birthDate` stays on Create account because the API requires it.
- **Forgot password** is the existing "Not implemented" toast. **Remember me** remembers the e-mail in
  `localStorage` (it does not keep the session longer).

### Errors

A failed sign in shows a generic **danger alert** ("We couldn't sign you in" — it never says whether the
e-mail or the password was wrong) *and* the toast with the API's sentence. Create account does the same
with an "email already has an account" alert, with a link to Sign in, when the API answers
`Email already exists`. An empty submit shows the documented toast and the inline field errors.

### Session

On submit, `login/_actions/login.ts` (a Server Action) calls the API, then writes the returned token into
an **httpOnly** cookie via `apps/web/lib/session.ts` — never into `localStorage`, and never readable by
client JavaScript. `proxy.ts` redirects an unauthenticated visitor away from any `/home`, `/company`,
`/erp` or `/fsm` URL to `/login?next=<path>`, and the login action redirects back to `next` on success
(same-origin paths only).

### Register redirect

Registering shows a success toast, then redirects to `/login` after a 1.5s pause so the toast is readable
without feeling stuck — the timer is owned by a `useEffect` cleanup, so it is cancelled if the user
navigates away first.
