# QA Automation — `data-testid` Standard (Option B)

This document is the **single source of truth** for `data-testid` in this project.

## Contract (Option B)

You chose option **B**:

- **Required** on all **interactive** elements (e.g. `button`, `a`, `input`, `select`, `textarea`, elements with `role="button"`, etc.)
- **Required** on **key** elements for E2E tests:
  - page/feature containers (e.g. the login main card)
  - main titles
  - forms
  - error/validation messages
  - tables and per-row actions (when they exist)

> It is not required to add `data-testid` to every purely structural `div/span`, unless it improves test stability or clarity.

---

## Naming (Pattern)

Pattern:

`data-testid="{domain}-{page}-{element}-{action}"`

Rules:

- **lowercase**
- **kebab-case** (hyphens)
- **stable** (never dynamic/random; does not depend on visible text, index, timestamp)
- **descriptive** (e.g. `data-testid="login-submit-button"`)

---

## Examples (login)

- `auth-login-form`
- `auth-login-input-email`
- `auth-login-input-password`
- `auth-login-button-submit`
- `auth-login-link-forgot`

---

## Examples (dashboard shell — Topbar, sidebar, breadcrumb, search)

- `dashboard-header`, `dashboard-sidebar`, `dashboard-main`
- `dashboard-sidebar-toggle` (now lives at the top of the sidebar itself, not the header)
- `dashboard-nav-module`, `dashboard-nav-group` (per-row — repeated by design, one per Módulo/Grupo; scope with the row's own locator, e.g. by its visible label)
- `sidebar-back-to-modules` (the "← Módulos" row shown while a module's groups are drilled into)
- `sidebar-flyout-categories`, `sidebar-flyout-category`, `sidebar-flyout-routines`, `sidebar-flyout-routine` (the cascading Categoria → Rotina flyout off a Grupo row)
- `breadcrumb-trail`, `breadcrumb-home`, `breadcrumb-current` (Início > Módulo > Grupo > Categoria > Rotina — only the first and last segments are links)
- `global-search-input` (the header box itself is the real search input — no separate trigger element), `global-search-dialog`, `global-search-results`
- `global-search-result` (per-row, repeated), `global-search-result-open-new-tab`, `global-search-result-favorite`
- `header-user-menu`, `header-user-avatar`, `header-user-dropdown`, `header-dropdown-notifications`, `header-dropdown-about`, `header-dropdown-signout`

---

## Examples (shared listing infrastructure — `components/data-table/`)

Every listing screen's shared pieces (`DataTable`, `ToolbarList`, `ColumnFilter`, `FilterDrawer`,
`GridCustomizationModal`, `ExportModal`, `Pagination`, `RowActionsMenu`) take a `testIdPrefix` prop
(e.g. `"person-list"`) and build ids as `{testIdPrefix}-{shared-suffix}` — the component is reused
across screens, but every id it renders still follows the documented `{domain}-{page}-...` shape,
never a generic one. People's instance (`testIdPrefix="person-list"`) is the reference:

- `person-list-toolbar`, `person-list-toolbar-search`, `person-list-toolbar-search-clear`, `person-list-toolbar-export`, `person-list-toolbar-customize`, `person-list-toolbar-refresh`, `person-list-toolbar-filters`
- `person-list-table-container`, `person-list-table`, `person-list-tbody`
- `person-list-checkbox-select-all`, `person-list-checkbox-row` (per-row, repeated by design — scope with the row's own locator)
- `person-list-column-header-{columnId}` (per column, e.g. `-name`, `-createdAt` — stable ids from the column's own declared key, not a database id)
- `person-list-column-filter-{columnId}`, `person-list-column-filter-{columnId}-input`
- `person-list-row-actions-trigger` (the "⋮" button — static, repeated per row; right-click opens the same menu with no id of its own)
- `person-list-row-action-view`, `person-list-row-action-edit`, `person-list-row-action-delete` (also static/repeated — scope by row)
- `person-list-pagination`, `person-list-pagination-first`, `person-list-pagination-prev`, `person-list-pagination-info`, `person-list-pagination-next`, `person-list-pagination-last`, `person-list-pagination-page-size`, `person-list-pagination-range` (the "Showing X–Y of Z" text), `person-list-pagination-selection`/`person-list-pagination-clear-selection` (replaces `-range` once at least one row is selected)
- `person-list-filter-drawer`, `person-list-filter-drawer-{fieldKey}`, `person-list-filter-drawer-clear`, `person-list-filter-drawer-close`
- `person-list-customize-modal`, `person-list-customize-checkbox-{key}`, `person-list-customize-move-up-{key}`, `person-list-customize-move-down-{key}`, `person-list-customize-restore`, `person-list-customize-save`
- `person-list-export-modal`, `person-list-export-checkbox-{key}`, `person-list-export-move-up-{key}`, `person-list-export-move-down-{key}`, `person-list-export-confirm`

## Examples (people — list + form)

- `person-list-container`, `person-list-title`, `person-list-table-card`
- `person-list-button-add`, `person-list-button-edit`, `person-list-button-delete`
- `person-list-empty-button-add` (the "Add the first person" action inside the empty state)
- `person-list-delete-dialog`, `person-list-delete-confirm`, `person-list-delete-cancel` (the delete `AlertDialog` — same dialog for a single row or a multi-select batch, title/description pluralize accordingly)
- `person-form-container`, `person-form-title`, `person-form`
- `person-form-label-{field}`, `person-form-input-{field}`, `person-form-error-{field}` — **now present on all 12 fields**, not only `name`/`document`/`email` (a gap the React Hook Form rewrite closed; a field with no validation rule simply never populates its `-error-` slot)
- `person-form-multiselect-types` (a person can hold more than one type at once — a searchable multi-select, `components/ui/multi-select.tsx`, with a chip per selected type; replaced the standalone checkbox group), `person-form-error-types`
- `person-form-input-document-type` (select — only rendered when `types` includes `CLIENT` or `SUPPLIER`), `person-form-error-document-type`, `person-form-checkbox-active`
- `person-form-button-save`, `person-form-button-cancel`
- `person-record-button-edit`, `person-record-link-back` (the read-only view route)

## Examples (auth layout, landing)

- `auth-layout`, `auth-banner` (the `(auth)` split-screen shell)
- `landing-page`, `landing-button-signin`, `landing-button-start`, `landing-button-register`, `landing-link-styleguide`
- `header-button-theme` (the light/dark toggle)

---

## Examples (access control — profiles, accounts)

Both Perfis and Usuários are on the shared listing infrastructure now — same `{testIdPrefix}-{shared-suffix}`
ids the "shared listing infrastructure" section above documents (toolbar, table, pagination, filter
drawer, customize/export modals, row-actions trigger). Neither renders a per-row `data-testid` on the
`<TableRow>` itself — same as People — so scope a row by its own visible text (e.g. the person's or
profile's name), not an id.

### Perfis (`testIdPrefix="profile-list"`)

- `profile-list-container`, `profile-list-title`, `profile-list-table-card`
- `profile-list-column-header-{name|description|permissionCount|isDefault|isSystem}`, `profile-list-column-filter-{columnId}`(`-input`)
- `profile-list-checkbox-select-all`, `profile-list-checkbox-row` (per-row, repeated by design)
- `profile-list-row-actions-trigger`, `profile-list-row-action-edit`, `profile-list-row-action-delete` (`edit`/`delete` disabled in the DOM, not hidden, for an `isSystem` profile)
- `profile-button-add`, `profile-button-edit`, `profile-button-delete` (the page-header actions — same free multi-select model as People: Edit needs exactly one row, Delete needs one or more)
- `profile-empty-button-add`
- `profile-delete-dialog`, `profile-delete-confirm`, `profile-delete-cancel` (same dialog for one row or a multi-select batch, title/description pluralize accordingly)
- `profile-form-container`, `profile-form-title`, `profile-form`
- `profile-form-label-{name|description|permissions}`, `profile-form-input-{name|description}`, `profile-form-error-{name|description|permissions}`
- `profile-form-checkbox-permission-{resource}-{action}` (e.g. `profile-form-checkbox-permission-person-view` — keyed by the catalog's stable resource/action pair, not a database id, so it doesn't shift between seeds)
- `profile-form-button-save`, `profile-form-button-cancel`

### Usuários (`testIdPrefix="account-list"`)

No `profile-list-checkbox-*` equivalent here — this screen passes `enableSelection={false}` to
`DataTable` (no bulk action ever needs a selected row), so no selection column renders at all.

- `users-page-container`, `users-page-title` (kept from the original placeholder — the Controle de
  Acesso screen replaced the placeholder's content, not its container)
- `account-list-table-card`
- `account-list-column-header-{personName|email|role|active|profileCount|createdAt}`, `account-list-column-filter-{columnId}`(`-input`)
- `account-list-select-role` (per-row `<Select>`, hidden for `SYSTEM` accounts, which render a plain badge instead), `account-list-button-toggle-active`, `account-list-button-manage-profiles` — all three are directly-interactive cells (`account-columns.tsx`'s `buildAccountColumns()`), not read-only values behind a row action
- `account-list-row-actions-trigger`, `account-list-row-action-manage-profiles` (the same "manage profiles" action, reachable via the ⋮ menu / right-click too — see `RowActionsMenu` above)
- `account-profiles-dialog`, `account-profiles-row`, `account-profiles-checkbox` (per-row inside the dialog, repeated — scope by the row's own text)
- `account-section` (the conditional block on the Person view/edit pages, shown only to an ADMIN when `types` includes `USER`)
- `account-section-none`, `account-section-email`, `account-section-link-manage`
- `account-section-create-form`, `account-section-label-{email|password}`, `account-section-input-{email|password}`, `account-section-error-{email|password}`, `account-section-button-create`

---

## Anti-patterns (do not do this)

- `data-testid="submit"` (too generic)
- `data-testid="button-1"` (order-dependent)
- `data-testid="user-${id}"` (dynamic)
- `data-testid` based on button text (breaks with i18n/copy changes)

---

## Quick checklist (before opening a PR)

- [ ] Every new interactive element has a `data-testid`
- [ ] Key flow elements have `data-testid` (container, title, form, errors)
- [ ] Test IDs follow the pattern and are descriptive/stable

