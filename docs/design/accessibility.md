# Design — Accessibility

- Adequate contrast (WCAG)
- Visible focus states on interactive elements
- Logical tab order

QA selectors (`data-testid`) live in `docs/qa/testids.md` (do not duplicate rules here).

## apps/web (Next.js)

shadcn/ui components build on Radix UI primitives, which handle focus management, keyboard interaction and ARIA attributes correctly out of the box (e.g. `Checkbox` renders a real `button[role=checkbox]` with `aria-checked`, `Label` uses Radix's `Label.Root` which correctly associates with its control). This doesn't relax the criteria above — it's an implementation detail that makes them easier to meet, not a replacement for verifying them.

