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

**Errors never move the layout** (decided 2026-11-10, replacing the handoff's "message replaces the help text"). A failing field shows a red border and a red label (`aria-invalid`); its message goes to a **toast** — "Field: message", plus how many more fields need attention — raised by `useEntityForm` (or `reportInvalidFields` for a form that submits on its own), and the first invalid field is scrolled into view and focused. `FormMessage` still holds the message, visually hidden, linked from the control by `aria-describedby` and `aria-live="polite"`, so a screen reader announces it. **A save that works says so too**: a create/edit action returns `{ success: true }` and `useEntityForm`'s `onSuccess` (`{ message, href }`) shows the success toast and navigates — an action never `redirect()`s on its own, which left no moment to confirm the save. A business rule refused by the API (a duplicate code) is a toast too, and the field it names turns red. Required fields are marked: `<FormItem required>` puts an asterisk on the label and `aria-required` on the control. Help text (`FormDescription`) stays in place while the field fails. `Input`/`Label`/`Checkbox`/`Select`/`Textarea` (`apps/web/components/ui/`) all spread `...props` onto the real DOM element, so `data-testid` always lands on the actual interactive element, never a wrapper — the QA rule in `docs/qa/testids.md` applies unchanged.

### Shared field layout: `person-form-fields.tsx`

The fields of a Person record are defined once in `apps/web/components/people/person-form-fields.tsx` and reused by all three modes (create, edit, view — the latter via a `disabled` prop, not a separate read-only markup). This replaced ~230 lines of near-duplicated label/input/error blocks in the legacy single-file form, and is what made it possible for every field to show a validation error, not only the three the legacy form wired up.

### Lists inside a form: `RepeatableCards`

A record that owns several sub-records — a person's addresses and contact people (`Address`, `Contact`; plan § 2.9) — shows them as cards in their own section, through `apps/web/components/forms/repeatable-cards.tsx` (RHF `useFieldArray`). Each card has a heading (its label or name, else "Address 2"), a **Primary** badge or a **Make primary** button, and a remove button; **Add …** sits under the last card, and an empty list says so in a dashed box. The first item added is the primary one and removing the primary hands the role to the first left — the API enforces the same rule (exactly one primary, `withOnePrimary`) and a partial unique index backs it. The form sends the whole list; the API updates existing items in place by id, creates new ones and removes the missing ones, in one transaction. An address's fields come from `AddressFields` with `withDetails` (type, label, reference point). In view mode the cards are read-only and the add/remove/primary controls are disabled or hidden.

### Masking and locale

`document` and `phone` are masked live via `apps/web/lib/masks.ts` (pure functions, covered by `tests/unit/masks.test.ts`). Dates, currency and any other locale-sensitive display go through `apps/web/lib/format.ts` (`Intl.DateTimeFormat`/`Intl.NumberFormat`), not hand-built string templates.
