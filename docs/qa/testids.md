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

## Examples (dashboard shell)

- `dashboard-header`, `dashboard-sidebar`, `dashboard-main`
- `dashboard-sidebar-toggle`
- `dashboard-nav-users`, `dashboard-nav-people`
- `header-user-menu`, `header-user-avatar`, `header-user-dropdown`, `header-dropdown-about`, `header-dropdown-signout`

---

## Examples (people — list + form)

- `person-list-container`, `person-list-title`, `person-list-table-container`, `person-list-table`, `person-list-tbody`, `person-list-pagination`
- `person-checkbox-select-all`, `person-button-add`, `person-button-edit`, `person-button-delete`
- `person-pagination-prev`, `person-pagination-info`, `person-pagination-next`
- `person-form-container`, `person-form-title`, `person-form`
- `person-form-label-{field}`, `person-form-input-{field}`, `person-form-error-{field}` for `name`/`document`/`email` (fields with validation) — same pattern without `-error-` for fields that don't validate (`phone`, `birthdate`, `street`, `city`, `state`, `zipcode`, `notes`)
- `person-form-input-type`, `person-form-input-document-type` (selects), `person-form-checkbox-active`
- `person-form-button-save`, `person-form-button-cancel`

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

