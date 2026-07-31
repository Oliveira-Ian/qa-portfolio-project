# Design — Components — Buttons

> This file covers the rules behind the component. For a live, always-current view of every
> variant/size/state — rendered from the real component, not a screenshot — see
> [`/styleguide`](/styleguide)`#buttons-actions-button`.

## Primary button

Rule: consistent visuals, visible focus, and an appropriate touch target — `h-10` (40px) default, up from shadcn's stock `h-8`, since this is a back-office UI people click through for hours rather than a marketing page.

For QA, every button must have a `data-testid` following `docs/qa/testids.md`.

## apps/web (Next.js)

`apps/web/components/ui/button.tsx` — shadcn's `Button`, with the token styling (`rounded-md`, `shadow-button`, olive/amber/clay palette, `focus-visible:ring-3`) built into the `default`/`outline`/`secondary`/`ghost`/`destructive`/`link` variants themselves, so a call site never needs to override classes to match the design system:

```tsx
<Button>Save person</Button>
<Button variant="destructive">Delete</Button>
```

Sizes: `default` (40px), `sm` (36px), `lg` (44px), `xs`, and `icon`/`icon-sm`/`icon-lg`/`icon-xs` for icon-only buttons (which still require `aria-label`, since the QA rule above doesn't relax the accessibility one). It spreads all props (including `data-testid`) onto the real `<button>`.
