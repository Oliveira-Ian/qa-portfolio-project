# Design — Layouts — Auth (Login / Register)

## Structure (split screen)

- Full-viewport-height container (`min-h-dvh`)
- Left side (~58%): the site photograph (banner), desktop only
- Right side: centered form

## Responsive

- `< 900px`: hide the banner and use 100% width for the form

## apps/web (Next.js)

`app/(auth)/layout.tsx` implements the split screen: the banner is `next/image` with `fill`, an ink-to-olive gradient overlay (`--auth-banner-overlay-*` tokens) over the photograph, the wordmark top-left, and a headline/eyebrow block anchored to the bottom. The `900px` breakpoint uses Tailwind's arbitrary-value variant (`max-[900px]:hidden`) since it doesn't match any default Tailwind breakpoint.

`login/_components/login-form.tsx` and `register/_components/register-form.tsx` render the forms — React Hook Form + `zodResolver(loginFormSchema | registerFormSchema)` from `packages/schemas`, not manual `useState`. The inline field messages and the API's own validation messages are deliberately worded differently for the same condition (see `docs/product/auth_rules.md`) — both come from `authMessages` in `packages/schemas/src/auth.ts`, which is the single place either side reads from.

### Session

On submit, `login/_actions/login.ts` (a Server Action) calls the API, then writes the returned token into an **httpOnly** cookie via `apps/web/lib/session.ts` — never into `localStorage`, and never readable by client JavaScript. `middleware.ts` (Next 16: `proxy.ts`) redirects an unauthenticated visitor away from any `(dashboard)` route to `/login?next=<path>`, and the login action redirects back to `next` on success.

### Register redirect

Registering shows a success toast, then redirects to `/login` after a 1.5s pause (down from the legacy 5s) so the toast is readable without feeling stuck — the timer is owned by a `useEffect` cleanup, so it's cancelled if the user navigates away first.
