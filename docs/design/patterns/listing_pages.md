# Design — Patterns — Listing Pages

Standard for pages that list a resource with sorting, filtering, column personalization, export
and row selection. First implemented by People
(`apps/web/app/(dashboard)/records/people/people/`), rebuilt on the shared
infrastructure in `apps/web/components/data-table/` described below — every listing screen composes
the same pieces rather than rewriting a table by hand. Profiles
(`.../administration/access-control/profiles/_components/profile-list.tsx`) and Users
(`.../access-control/users/_components/account-list.tsx`) are on the same infrastructure —
People was the reference implementation, these two are what proved it generalizes.

**Profiles** supplies `profile-columns.tsx` (Name/Description/Permissions/Default/System — the latter
two independent boolean columns rather than one merged "Flags" display, so each filters on its own)
and reuses the People shape exactly: a free multi-select grid, Edit/Delete in the page header, Delete
disabled — per row and in the header — for any `isSystem` profile.

**Users** is the screen that stretched the infrastructure furthest, and confirmed it didn't need to
change to fit: `account-columns.tsx` builds its `ColumnDef[]` from a function taking callbacks
(`buildAccountColumns({ onRoleChange, onToggleActive, onManageProfiles, isPending })`) rather than
declaring a static array, because Role (a `<Select>`), Status (a toggle button) and Profiles (a count
+ "manage" button) are all directly interactive cells, not read-only values — `ColumnDef.cell` already
supports that. This screen also has no Add/Edit/Delete header (accounts are created from a Person's
own record, never deleted here) and no bulk action needing a selected row, so it's the first consumer
to pass `enableSelection={false}` to `DataTable` — a prop the infrastructure already had, unexercised
until this screen needed it.

Sourced from the functional spec `docs/especificacoes/levantamento_cadastro_pessoa.md`: "the
Cadastro de Pessoa routine will be the first implementation of the listing module and will serve as
a reference for the other entities."

## Structure

- Page header (title + eyebrow + Add/Edit/Delete buttons) — screen-specific, sits above the toolbar,
  not part of the shared infrastructure.
- `ToolbarList` — global search, Export, Customize, Refresh, Filters.
- A bordered surface (`rounded-lg border border-border bg-card shadow-card`) holding `DataTable` +
  `Pagination`.
- `FilterDrawer`, `GridCustomizationModal`, `ExportModal` render outside that surface (`Sheet`/
  `Dialog`, opened by the toolbar's buttons).

## Shared components (`apps/web/components/data-table/`)

### `DataTable` + `useDataTable`
`useDataTable({ data, columns, getRowId, initialColumnVisibility?, initialColumnOrder? })` wraps
TanStack Table (`@tanstack/react-table`) with the state every listing shares: sorting, column
filters, global filter, row selection, column visibility/order, and pagination — all client-side for
now (the API has no `skip`/`take` yet; swapping to server-side pagination later means adding
`manualPagination`/`manualFiltering`/`manualSorting` here, not touching any component that calls the
hook). `DataTable` renders the resulting `Table` instance over the existing `components/ui/table.tsx`
primitives: a leading selection-checkbox column (header selects the current page, not every filtered
row), the routine's own columns via `flexRender`, `EmptyState` in place of the body when there are no
rows, and — when a `rowActions` prop is given — wraps each row in a right-click `ContextMenu` (see
`RowActionsMenu` below).

**Row click only selects.** Per the spec ("clicking a row only selects the record"), `DataTable` has
no click/double-click navigation. Viewing/editing/deleting a row is `RowActionsMenu`'s job.

### Selection model
A plain multi-select: any row's checkbox toggles independently (no more "selecting a new row clears
the others" asymmetry from the pre-rebuild version). **Edit** enables only when exactly one row is
selected; **Delete** enables for one or more — matches the spec exactly ("Editar: apenas um registro.
Excluir: um ou vários registros").

### `ColumnHeader`
Sort trigger with a 3-state indicator (ascending / descending / none), via TanStack's own
`column.getToggleSortingHandler()`. Columns without `enableSorting` render as plain text.

### `ColumnFilter` + `FilterDrawer`
A column declares `meta.filterType` (`'text' | 'boolean' | 'enum' | 'date' | 'number'`, via the
`filterableColumn()` helper in `column-helpers.ts`) and, for `enum`, `meta.filterOptions`. That's the
only thing a routine writes — `ColumnFilter` (a quick popover per column header) and `FilterDrawer`
(every filterable field of the routine at once, in a side panel) both read `meta.filterType` and
render the matching widget from the shared `FilterField` component, so the two never diverge for the
same column. Both write into the same TanStack `columnFilters` state, so a quick per-column filter and
the drawer combine rather than fight. The predicate for each `filterType` lives once in
`filter-fns.ts` — a routine never hand-writes a filter function.

### `ToolbarList`
Global search (`SearchInput`, incremental — writes to TanStack's own `globalFilter`), Export,
Customize, Refresh (`router.refresh()` — search/sort/filter/selection all live in `useDataTable`'s
client state, untouched by a server refetch, so nothing needs saving/restoring around it), and
Filters (badged with the active filter count). Business action buttons (Add/Edit/Delete) are **not**
part of this toolbar — they stay in the page's own header, as before.

### `GridCustomizationModal`
Show/hide + reorder (↑/↓ buttons, not drag-and-drop — keyboard-accessible for free, no second new
dependency) for every column the routine lists in its `CustomizableColumn[]`. Every action writes
straight to the live `table`'s own `columnOrder`/`columnVisibility` — the grid previews changes as
you make them. "Save" persists the result via the routine's own Server Action; "Restore default"
resets to each column's declared `defaultVisible` (not "show everything" — a routine must declare
which columns ship visible, or every column defaults to visible).

### `ExportModal`
Column choice/order for the export, pre-filled from the grid's current visible columns and order but
edited independently of it. Generates a CSV client-side (`Blob` + a synthetic download link) from
`table.getSortedRowModel()` — filtered and sorted, not just the current page, per the spec ("a
exportação deverá utilizar como base a configuração atual da grid"). A routine supplies
`ExportColumn<TData>[]` (key/label/`getValue`), reused as the base for `GridCustomizationModal`'s
column list so the two never drift.

### `RowActionsMenu`
Per-row actions (View/Edit/Delete for Person; any routine declares its own), exposed two ways from
one `RowAction[]` list: a always-visible "⋮" button (keyboard-operable) declared as a normal column in
the routine's `columns` array, and — when the routine passes the same list to `DataTable`'s
`rowActions` prop — a right-click `ContextMenu` on the row itself. Both open the identical menu.

### `Pagination`
Previous/Next + "Page X of Y", reading `table.getState().pagination` — ready for server-side
pagination later without changing its own code.

### `SearchInput`, `EmptyState`, `LoadingState`
Small building blocks `ToolbarList`/`DataTable` compose; also usable standalone (`LoadingState`
replaces a routine's own `loading.tsx` skeleton).

## Column personalization: backend persistence

Column show/hide + order is saved per account, not just in `localStorage` — `GridColumnPreference`
(Prisma model) + `GET`/`PUT /api/grid-preferences/:gridKey` (see `docs/api/http_responses.md`).
`gridKey` is a stable string the routine picks (`"person-list"`); the same table and endpoints serve
every future listing without new backend surface. A routine's own `_data-access/get-grid-preferences.ts`
fetches the saved preference in its `page.tsx` (falls back to the routine's built-in default column
set if the account never saved one); `_actions/save-grid-preferences.ts` is the Server Action
`GridCustomizationModal`'s `onSave` calls.

## What stays exclusive to a routine (not shared)

- Its `ColumnDef<TData>[]` (`person-columns.tsx`) — cell renderers, `meta.filterType`, which fields
  exist at all.
- Its `FilterDrawerField[]` (`person-filter-fields.tsx`) — the curated subset shown in the side panel.
- Its `RowAction[]` builder — which actions exist, their permission gating, and what each does.
- Its bulk-delete Server Action (`_actions/delete-persons.ts` — loops the existing single-record
  `DELETE`, no new bulk endpoint, so the documented HTTP contract stays unchanged) and its
  `_actions/save-grid-preferences.ts` / `_data-access/get-grid-preferences.ts` (same shape every
  routine needs, but keyed to its own `gridKey`).
- The page's own title, breadcrumb (resolved by the navigation catalog), and Add/Edit/Delete header
  buttons.

## Record actions routing (apps/web)

Unchanged: `/people/new` → `/records/people/people/new`, `.../[id]` (view),
`.../[id]/edit`, each its own `page.tsx` + thin form component built on
`components/people/person-form-fields.tsx`. The view route renders no Save button at all.

## Validation

Unchanged: `personFormSchema` from `packages/schemas` via `zodResolver` — see
`docs/design/components/forms.md`.
