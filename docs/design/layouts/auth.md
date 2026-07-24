# Design — Layouts — Auth (Login)

## Structure (split screen)

- `.login-container` with viewport height
- Left side: banner (desktop)
- Right side: centered card

## Responsive

- `< 900px`: hide the banner and use 100% width for the form
- `< 480px`: reduce padding and title typography

## apps/web (Next.js)

`app/(auth)/layout.tsx` implements the split screen (banner via `next/image` with `fill`, gradient overlay using `--auth-banner-overlay-*` tokens); `login/page.tsx` and `register/page.tsx` render the card via `components/auth/login-form.tsx` / `register-form.tsx`. The `900px` breakpoint uses Tailwind's arbitrary-value variant (`max-[900px]:hidden`, `max-[900px]:flex-[0_0_100%]`) since it doesn't match any default Tailwind breakpoint. Validation is hand-written (not schema-driven) to guarantee exact parity with the messages in `docs/product/auth_rules.md` — same approach as `apps/api`'s auth controller.

