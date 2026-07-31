# Design — Components — Forms

> This file covers the rules behind the components. For a live, always-current view of every form
> control — Input, Select, Combobox, MaskedInput, DatePicker, FileUpload, and the rest — rendered
> from the real component, not a screenshot, see
> [`/styleguide`](/styleguide)`#form-controls`.

## Inputs

- Use tokens from `docs/design/tokens.md`
- States: default/hover/focus/error

## Labels

- Always above the input (do not use placeholders as labels)

## apps/web (Next.js)

Forms are built with **React Hook Form + `@hookform/resolvers/zod`**, validated against the schemas in `packages/schemas` (`loginFormSchema`, `registerFormSchema`, `personFormSchema`) — not manual `useState` + hand-rolled checks. `apps/web/components/ui/form.tsx` is shadcn's `Form` primitive (`FormField`/`FormItem`/`FormLabel`/`FormControl`/`FormMessage`), which wires a field's label, control and error message together via generated ids (`aria-describedby`, `aria-invalid`) so a screen reader announces the error the moment focus lands on an invalid field.

`FormMessage` renders nothing until a field actually fails, with `aria-live="polite"` on the element itself so newly-appearing errors are announced without moving focus. `Input`/`Label`/`Checkbox`/`Select`/`Textarea` (`apps/web/components/ui/`) all spread `...props` onto the real DOM element, so `data-testid` always lands on the actual interactive element, never a wrapper — the QA rule in `docs/qa/testids.md` applies unchanged.

### Shared field layout: `person-form-fields.tsx`

The 12 fields of a Person record are defined once in `apps/web/components/people/person-form-fields.tsx` and reused by all three modes (create, edit, view — the latter via a `disabled` prop, not a separate read-only markup). This replaced ~230 lines of near-duplicated label/input/error blocks in the legacy single-file form, and is what made it possible for every field to show a validation error, not only the three the legacy form wired up.

### Masking and locale

`document` and `phone` are masked live via `apps/web/lib/masks.ts` (pure functions, covered by `tests/unit/masks.test.ts`). Dates, currency and any other locale-sensitive display go through `apps/web/lib/format.ts` (`Intl.DateTimeFormat`/`Intl.NumberFormat`), not hand-built string templates.
