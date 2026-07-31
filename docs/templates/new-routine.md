# Template — New Routine (listing screen)

The exact file tree a new business-data listing creates, and what belongs in each file. Follow this
when adding a routine like People, Profiles or Users — a screen that lists a resource with sorting,
filtering, column personalization, export and row selection, on top of the shared infrastructure in
`apps/web/components/data-table/` (see `docs/design/patterns/listing_pages.md` for what that
infrastructure does and doesn't own).

People (`apps/web/app/(dashboard)/records/people/people/`) is the reference implementation —
when in doubt, read its files instead of this document's prose.

## 0. Before writing any code

1. Add the routine to `apps/web/lib/navigation/catalog.ts` (Module/Group/Category it belongs under,
   or a new one) and to `apps/web/lib/navigation/routes.ts#ROUTES` (its `list`/`new`/`edit(id)` hrefs
   — see ADR 0007, `docs/adr/0007-navigation-catalog-url-shape.md`, for why the URL is
   Module/Group/Routine, three segments, even though the catalog nests four levels deep).
2. Add the backend module first if it doesn't exist yet (`apps/api/src/modules/<entity>/` —
   `route → controller → service → repository`, see `docs/product/domain.md` and
   `docs/api/http_responses.md`) and the Zod schema in `packages/schemas/src/<entity>.ts`.
3. If the routine is gated by a business permission (not just the technical `ADMIN` role), add its
   catalog entries to `packages/schemas/src/permissions.ts` and re-seed
   (`docs/product/access_control.md#adding-a-new-permission`).

## 1. File tree

```
apps/web/app/(dashboard)/<module>/<group>/<routine>/
├── page.tsx                          # list — Server Component
├── loading.tsx                       # optional — LoadingState skeleton
├── _components/
│   ├── <entity>-list.tsx             # the routine's DataTable composition
│   ├── <entity>-columns.tsx          # ColumnDef[] (or a builder fn — see Users)
│   └── <entity>-filter-fields.tsx    # FilterDrawerField[]
├── _actions/
│   ├── delete-<entities>.ts          # bulk delete — loops the single-record DELETE
│   └── save-grid-preferences.ts      # save<Entity>GridPreferenceAction
├── _data-access/
│   └── get-grid-preferences.ts       # <ENTITY>_GRID_KEY + get<Entity>GridPreference
│
├── new/
│   ├── page.tsx                      # permission check + redirect, then render the form
│   └── _components/
│       └── create-<entity>-form.tsx  # FormCard + FormCardHeader + FormCardActions
│   └── _actions/
│       └── create-<entity>.ts
│
└── [id]/
    ├── page.tsx                      # read-only view, if the routine has one
    ├── _components/
    │   └── <entity>-record.tsx       # FormCard, no Save footer
    ├── _data-access/
    │   └── get-<entity>.ts
    └── edit/
        ├── page.tsx
        ├── _components/
        │   └── edit-<entity>-form.tsx
        └── _actions/
            └── update-<entity>.ts
```

## 2. What each file does

### `page.tsx` (list)

Server Component. Fetches the row set, the account's grid preference, and (if the routine has
per-action business permissions like People's `person:view`/`create`/`edit`/`delete`) the `can()`
flags — all in one `Promise.all`. Passes plain data down; never passes a function or a component
reference as a prop into the client list component.

### `_components/<entity>-list.tsx`

The thin composition — `useDataTable` + `DataTable` + `ToolbarList` + `FilterDrawer` +
`GridCustomizationModal` + `ExportModal` + `Pagination`, plus `PageHeader` for the title/eyebrow/
Add-Edit-Delete actions/record-count `meta`. Copy People's or Profiles' file and adapt: entity type,
`gridKey`, header copy, row-action list, delete confirmation copy.

If most cells are directly interactive (a `<Select>`, a toggle button — like Users' Role/Status/
Profiles columns) rather than read-only, build `<entity>-columns.tsx` as a function taking callbacks
instead of a static array — see `account-columns.tsx#buildAccountColumns()`. If the screen has no
bulk action needing a selected row (Users again), pass `enableSelection={false}` to `DataTable`
and skip the AlertDialog/selection-tracking code entirely.

### `_components/<entity>-columns.tsx`

One `ColumnDef` per field, each header built via the `renderHeader(label)` closure pattern
(`ColumnHeader` + `ColumnFilter`), each filterable field spread with
`...filterableColumn<Entity>(filterType, options?)`. Also exports:
- `<ENTITY>_DEFAULT_VISIBLE_KEYS` — a `Set<string>` of which columns ship visible.
- `<ENTITY>_EXPORT_COLUMNS` — `ExportColumn<Entity>[]`, the base `GridCustomizationModal` and
  `ExportModal` both read from.
- `<ENTITY>_CUSTOMIZABLE_COLUMNS` — derived from the export columns + the default-visible set.

### `_components/<entity>-filter-fields.tsx`

The curated subset of columns shown in the Filters side panel — `FilterDrawerField[]`, one of each
`filterType` the entity actually needs, not necessarily every filterable column.

### `_actions/delete-<entities>.ts`

Accepts `ids: <IdType>[]`, loops the existing single-record `DELETE /api/<entities>/:id` — no new
bulk endpoint. Returns `ActionResult` (`@/lib/actions`). See `delete-persons.ts`/`delete-profile.ts`.

### `_actions/save-grid-preferences.ts` / `_data-access/get-grid-preferences.ts`

Identical shape every routine needs, keyed to its own `gridKey` (a short, stable, kebab-case string
like `"person-list"`). Copy People's pair verbatim and rename.

### Create/edit/view forms

Built on `useEntityForm` (`@/components/forms/use-entity-form`) + `FormCard`/`FormCardHeader`/
`FormCardActions` (`@/components/forms/form-card`) — see any of the five existing forms
(`create-person-form.tsx`, `edit-person-form.tsx`, `person-record.tsx`, `create-profile-form.tsx`,
`edit-profile-form.tsx`). A schema field with a `.default(...)` needs the same
`zodResolver(schema) as Resolver<Input, unknown, Input>` cast the Profile forms use — see the comment
in `create-profile-form.tsx` for why.

## 3. `data-testid` checklist

Follow `docs/qa/testids.md`'s pattern exactly — `{testIdPrefix}-{shared-suffix}` for anything the
shared `data-table/` components render (pass `testIdPrefix="<entity>-list"`), and
`{domain}-{page}-{element}-{action}` for everything the routine declares itself (header buttons,
empty-state action, delete dialog, form fields). Add the new ids to `docs/qa/testids.md` under
"Examples (access control — profiles, accounts)" or a new section, following the Profiles/Users
entries as the template.

## 4. Verification

No dedicated automated tests are written as part of adding a routine — the current phase of this
project (see `docs/qa/testing-status.md`) treats automated coverage as a separate, later effort.
Verify by hand instead: `npm run typecheck && npm run lint && npm run format && npm run build -w
apps/web`, then click through create/edit/view/delete, sorting, filtering (both the column popover
and the drawer), export, and column customization (including that it survives a reload) in a running
browser.
