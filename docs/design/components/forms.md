# Design — Components — Forms

## Inputs (`.form-input`)

- Use tokens from `docs/design/tokens.md`
- States: default/hover/focus/error

## Labels (`.form-label`)

- Always above the input (do not use placeholders as labels)

## apps/web (Next.js)

Use shadcn/ui's `Input`, `Label` and `Checkbox` (`apps/web/components/ui/`, added via `npx shadcn add input label checkbox`). All three spread `...props` onto the real DOM element (`Checkbox` onto Radix's `Root`, which renders a real `button[role=checkbox]`), so `data-testid` always lands on the actual interactive element, never a wrapper — the QA rule in `docs/qa/testids.md` applies unchanged.

`Input`'s default radius (`rounded-lg`) doesn't match this doc's `--radius-md`; apply `rounded-md shadow-input` at the call site, same pattern as buttons/cards.

