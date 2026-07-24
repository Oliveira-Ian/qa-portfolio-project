# Design — Components — Buttons

## Primary button

Rule: consistent visuals, visible focus, and an appropriate touch target.

For QA, every button must have a `data-testid` following `docs/qa/testids.md`.

## apps/web (Next.js)

Use shadcn/ui's `Button` (`apps/web/components/ui/button.tsx`, added via `npx shadcn add button`). It spreads all props (including `data-testid`) onto the real `<button>`, so the QA rule above still applies unchanged.

To match the legacy primary button exactly (`frontend/styles/components/buttons.css`), apply on top of the `default` variant:

```tsx
<Button className="rounded-md bg-primary text-primary-foreground shadow-button hover:bg-primary-hover">
  Sign In
</Button>
```

Shadcn's own `default` variant alone is close but not pixel-identical (it uses `rounded-lg` and a lighter hover); the classes above realign it with the documented tokens. `outline`, `secondary`, `ghost`, `destructive` and `link` variants are available for cases the legacy CSS never defined.

