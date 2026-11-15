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

## Action colours (decided 2026-11-15)

Tried on the FSM's work orders on 2026-11-14 and adopted for every screen of the Platform, the ERP
and the FSM: an action's colour says what it does, on a white button with the colour in its text,
border and icon.

| Action | Variant | Look | Text on white |
|---|---|---|---|
| Add / New / Save / Save changes | `create` | success-600 text, border and icon | 5.2:1 |
| Edit | `edit` | warning-600 (dark amber — a true yellow fails contrast) | 5.0:1 |
| Delete | `destructive-soft` | danger text | 6.5:1 |

On hover each takes its tone's 50 tint and darker text (≥ 6.7:1). They are built in where the
actions live — `EntityList` (Add, Edit, Delete), `FormCardActions` (Save), `RecordForm`'s view
(Edit), `RepeatableCards` (Add) — so a new screen gets them without choosing. The product accent
(`default`) stays for actions that are none of these: sign in, start a work order, confirm. A
filled `destructive` stays inside a confirmation only.

This departs from the handoff (primary = product accent) by decision; the success and warning
tones are shared with the status palette, which is why the button carries a word and an icon,
never the colour alone.
