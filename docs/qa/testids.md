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

## Examples (the shell — global bar, sidebar, breadcrumb, search)

One shell for the Platform, Oliveira ERP and the FSM placeholder (`docs/design/layouts/dashboard.md`).

- `dashboard-header` (the global bar), `dashboard-header-logo`, `dashboard-sidebar`, `dashboard-main`
- `shell-menu-button`, `shell-drawer` (below 1024px the sidebar is a drawer, opened from the bar)
- `product-switcher`, `product-switcher-menu`, `product-switcher-{platform|erp|fsm}` (one entry per product, with its access state)
- `header-company` (the company's name in the bar)
- `nav-home`, `nav-company`, `nav-members`, `nav-product-access` (Platform sidebar); `nav-erp-overview`, `nav-erp-{module}-{routine}` (e.g. `nav-erp-records-people`, `nav-erp-administration-users` — keyed by the catalogue's own slugs, so they follow `lib/navigation/catalog.ts`)
- `breadcrumb-trail`, `breadcrumb-current` (the product first, no repeated segment — only the pages in the trail are links)
- `global-search-open`, `global-search-dialog`, `global-search-input`, `global-search-results`
- `global-search-result` (per-row, repeated), `global-search-result-open-new-tab`, `global-search-result-favorite`
- `header-user-menu`, `header-user-name`, `header-user-dropdown`, `header-dropdown-signout`
- `language-switch`, `language-switch-{en|pt-BR}` (the switch in the account menu, the mobile drawer and the auth top bar); the auth header's compact copy is `auth-mobile-language-switch`, `auth-mobile-language-switch-{en|pt-BR}`

The old shell's `dashboard-sidebar-toggle`, `dashboard-nav-*`, `sidebar-flyout-*`, `header-user-avatar`,
`header-dropdown-notifications`, `header-dropdown-about` and `header-button-theme` are gone — there is no manual
sidebar toggle, no flyout, no About/Notifications item and no theme toggle in the new design; the specs that used them
(`dashboard.spec.ts`, `people.spec.ts`) are the disabled ones (`docs/qa/testing-status.md`).

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
- `person-list-pagination`, `person-list-pagination-prev`, `person-list-pagination-next`, `person-list-pagination-page-size`, `person-list-pagination-range` (the "Showing X–Y of Z" text), `person-list-pagination-selection`/`person-list-pagination-clear-selection` (replaces the range text once at least one row is selected). The page numbers have no ids — they are buttons named "Page N" (`aria-current="page"` on the current one); there are no first/last/info elements any more
- `person-list-active-filters`, `person-list-active-filter-{columnId}`, `person-list-active-filter-remove-{columnId}`, `person-list-active-filters-clear-all` (the removable tags next to the Filters button)
- `person-list-filter-drawer`, `person-list-filter-drawer-{fieldKey}`, `person-list-filter-drawer-clear`, `person-list-filter-drawer-close`
- `person-list-customize-modal`, `person-list-customize-checkbox-{key}`, `person-list-customize-move-up-{key}`, `person-list-customize-move-down-{key}`, `person-list-customize-restore`, `person-list-customize-save`
- `person-list-export-modal`, `person-list-export-checkbox-{key}`, `person-list-export-move-up-{key}`, `person-list-export-move-down-{key}`, `person-list-export-confirm`

## Examples (people — list + form)

- `person-list-container`, `person-list-title`, `person-list-table-card`
- `person-list-button-add`, `person-list-button-edit`, `person-list-button-delete`
- `person-list-tabs`, `person-list-tab-all`, `person-list-tab-clients`, `person-list-tab-suppliers` (the type tabs — a shortcut to the `Type` filter, with the registry's counts)
- `person-list-empty-button-add` (the "Add the first person" action inside the empty state — only when nothing is filtered)
- `{prefix}-no-results-button-clear` (every listing: "Clear search and filters", inside the "No results" state a search or filter that matches nothing shows instead of the empty state), `{prefix}-export-scope` (the Export dialog's note that it writes only the rows on the current page)
- `person-list-delete-dialog`, `person-list-delete-confirm`, `person-list-delete-cancel` (the delete `AlertDialog` — same dialog for a single row or a multi-select batch, title/description pluralize accordingly)
- `person-form-container`, `person-form-title`, `person-form`, `person-form-error-summary` (the "Check N fields" alert, after a failed submit)
- `person-form-section-{identification|contact|address|notes}` (the form is four sections on one page — it used to be four tabs, `person-form-tab-*`, which are gone), `person-form-actions` (the sticky Cancel/Save bar; every `FormCard` form has one, as `{form}-actions`)
- `person-form-label-{field}`, `person-form-input-{field}`, `person-form-error-{field}` — **now present on all 12 fields**, not only `name`/`document`/`email` (a gap the React Hook Form rewrite closed; a field with no validation rule simply never populates its `-error-` slot)
- `person-form-types` (the group), `person-form-type-{client|supplier|user|employee}` (a toggle chip each, `aria-pressed` — a person can hold more than one type at once; replaced the multi-select, `person-form-multiselect-types`), `person-form-error-types`
- `person-form-input-document-type` (select — only rendered when `types` includes `CLIENT` or `SUPPLIER`), `person-form-error-document-type`, `person-form-checkbox-active`
- `person-form-button-save`, `person-form-button-cancel`
- `person-record-button-edit`, `person-record-link-back` (the read-only view route)

## Examples (auth — sign in, create account)

- `auth-layout`, `auth-panel` (the dark brand panel, ≥ 900px), `auth-mobile-header` (its compact form below 900px)
- `auth-login-card`, `auth-login-title`, `auth-login-form`, `auth-login-label-{email|password}`, `auth-login-input-{email|password}`, `auth-login-error-{email|password}`, `auth-login-button-toggle-password`, `auth-login-checkbox-remember`, `auth-login-link-forgot`, `auth-login-button-submit`, `auth-login-link-register`
- `auth-login-alert` (the generic "We couldn't sign you in" alert — the API's sentence is in the toast)
- `auth-register-card`, `auth-register-title`, `auth-register-form`, `auth-register-label-{fullname|email|password|birthdate}`, `auth-register-input-{fullname|email|password|birthdate}`, `auth-register-error-{fullname|email|password|birthdate}`, `auth-register-button-toggle-password`, `auth-register-button-submit`, `auth-register-link-login`
- `auth-register-alert-email-taken` (with the link to Sign in)

The public landing page and its `landing-*` ids no longer exist: `/` redirects to `/home` or `/login`.

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
- `profile-form-container`, `profile-form-title`, `profile-form`, `profile-form-error-summary`, `profile-form-scope-note` (the "Permissions inside {product}" info alert)
- `profile-form-input-code` (read-only), `profile-form-permission-matrix` (the screen × action table)
- `profile-form-label-{name|description|permissions}`, `profile-form-input-{name|description}`, `profile-form-error-{name|description|permissions}`
- `profile-form-checkbox-permission-{resource}-{action}` (a cell of the matrix, or an "other permission" such as `profile-form-checkbox-permission-profile-manage`; e.g. `profile-form-checkbox-permission-person-view` — keyed by the catalog's stable resource/action pair, not a database id, so it doesn't shift between seeds)
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

## Examples (the Platform — Home, company administration, guards)

`docs/design/layouts/platform.md`. A row of a list is addressed by the membership's id in the id itself
(`company-member-row-{id}`) — those ids come from the API, so a test reads them from the page, it does not
invent them.

### Home

- `home-page`, `home-page-title`, `home-overline`
- `product-card-{erp|fsm}` (the whole card), `product-card-{erp|fsm}-chip` (its access chip)
- `home-company-strip`, `home-strip-members`, `home-strip-erp-seats`, `home-strip-admin` (admins only)
- `home-account-email` (the no-company state)

### Company, members, product access (`/company/*`)

- `company-overview-page`, `company-overview-title`, `company-overview-name`, `company-overview-members`, `company-overview-access`
- `company-contracts-table`, `company-contract-{erp|fsm}`
- `company-members-page`, `company-members-title`, `company-members-add`, `company-members-search`, `company-members-filter-role`(`-{all|ADMIN|MEMBER}`), `company-members-filter-status`(`-{all|ACTIVE|INACTIVE}`), `company-members-sort-{name|joined}`, `company-members-table`, `company-members-empty`
- `company-member-row-{id}`, `company-member-open-{id}` (the name link that opens the drawer), `company-member-actions-{id}`
- `company-members-pagination`, `-pagination-range`, `-pagination-page-size`, `-pagination-prev`, `-pagination-next`
- `company-member-drawer`, `company-member-role`, `company-member-role-{admin|member}`, `company-member-seat-{erp|fsm}`, `company-member-manage-link`, `company-member-inactive-note`, `company-member-over-limit`
- `company-member-save`, `company-member-cancel`, `company-member-deactivate`, `company-member-reactivate`
- `company-member-deactivate-dialog`, `company-member-deactivate-confirm`, `company-member-deactivate-cancel`
- `company-add-member-dialog`, `company-add-member-form`, `company-add-member-email`, `company-add-member-email-error`, `company-add-member-submit`, `company-add-member-cancel`
- `company-product-access-page`, `company-product-access-title`, `company-access-tab-{erp|fsm}`, `company-access-search`, `company-access-licenses`, `company-access-unsaved`, `company-access-table`
- `company-access-row-{id}`, `company-access-switch-{id}`
- `company-access-save`, `company-access-discard`, `company-access-over-limit`, `company-access-suspended`

### Guards, errors, the FSM placeholder

- `no-product-access`, `no-product-access-title`, `no-product-access-home` (a product URL without a seat)
- `no-permission`, `no-permission-title`, `no-permission-back` (an ERP screen without the View permission)
- `no-company-admin`, `no-company-admin-title`, `no-company-admin-back` (`/company/*` for a non-admin)
- `{testIdPrefix}-boundary`, `-boundary-title`, `-boundary-button-retry` (the error boundaries; `dashboard-error` inside a product)
- `not-found-title`, `not-found-button-home`
- `fsm-placeholder`, `fsm-back-home`

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

