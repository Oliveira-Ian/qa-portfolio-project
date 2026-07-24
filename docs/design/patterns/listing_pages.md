# Design — Patterns — Listing Pages

Standard for pages that list a resource with row selection and record actions (first implemented by People, `apps/web/app/(dashboard)/people/`).

## Structure

- `content-card`-style container (`--bg-card`, `--radius-lg`, `--shadow-card`) holding a toolbar + table + pagination.
- Toolbar: page title on the left, action buttons on the right — **Add** (always enabled, primary color), **Edit** and **Delete** (disabled unless exactly one row is selected).
- Table: a header checkbox selects/clears every row; each row has its own checkbox. Double-clicking a row opens it in **view** mode (read-only).
- Pagination: present for structural consistency even when there's only one page (matches the legacy `people.html` — no real pagination exists yet since the API has no `skip`/`take` params; adding it is a future improvement, not part of this pattern).

## Selection model

A single `Set` of selected row IDs (not just a boolean):

- Clicking a row's own checkbox toggles it — but selecting a *new* row clears any other selection first, so only one row is ever individually selectable this way.
- The header checkbox can select **all** rows at once (bypassing the single-selection behavior above).
- **Edit**/**Delete** only enable when the selection size is exactly 1, regardless of how it was reached.

This looks asymmetric (why allow "select all" if actions need exactly one?) but it's the documented legacy behavior, preserved as-is rather than "fixed" without being asked.

## Delete confirmation

Uses shadcn/ui's `AlertDialog`, not the browser's `confirm()` — consistent with the rest of the app's UI (toast for feedback, dialogs for confirmation), even though `confirm()` is what the legacy `people.html` used.

## Record actions routing (apps/web)

Legacy `frontend/` used a single `person-form.html` page reading `?id=&mode=` query params for create/edit/view. `apps/web` uses path segments instead — `/people/new`, `/people/[id]` (view), `/people/[id]/edit` — more idiomatic for Next.js App Router. Same shared form component (`components/people/person-form.tsx`) and `data-testid`s power all three modes either way.

## Validation

The form uses `personCreateSchema` from `packages/schemas` directly (`safeParse`) instead of hand-written checks — its messages already match the legacy ones exactly ("Name is required", "Document is required", "Invalid document format", "Invalid email"), so this is a case where reusing the shared schema achieves both DRY and message parity at once (unlike the auth forms, where hand-written checks were needed instead — see `docs/design/layouts/auth.md`).
