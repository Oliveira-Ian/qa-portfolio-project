# Design — Accessibility

- Adequate contrast (WCAG)
- Visible focus states on interactive elements
- Logical tab order

QA selectors (`data-testid`) live in `docs/qa/testids.md` (do not duplicate rules here).

## apps/web (Next.js)

shadcn/ui components build on Radix UI primitives, which handle focus management, keyboard interaction and ARIA attributes correctly out of the box (e.g. `Checkbox` renders a real `button[role=checkbox]` with `aria-checked`, `Label` uses Radix's `Label.Root` which correctly associates with its control). This doesn't relax the criteria above — it's an implementation detail that makes them easier to meet, not a replacement for verifying them.

Contrast is checked per-token, not just eyeballed — `docs/design/tokens.md` documents why `--signal` (amber) has a separate `--signal-strong` for text, and why `--sidebar-section`'s opacity has a hard floor. `tests/e2e/a11y.spec.ts` runs `@axe-core/playwright` against `/login`, `/register`, `/home`, `/people` and `/people/new` with zero tolerance for `wcag2a`/`wcag2aa` violations — but only the `/login`/`/register` cases are currently active; the other three require a session and are temporarily disabled (`test.fixme`, since without a logged-in page they silently audit `/login` instead of the page they claim to). See `docs/qa/testing-status.md` for what's disabled and why, and treat this page as the reasoning a future authenticated a11y pass will restore, not as a gate that's fully wired up today.

Motion respects `prefers-reduced-motion` globally (`globals.css` `@layer base`, a media query that collapses all transition/animation durations to near-zero) rather than per-component.

