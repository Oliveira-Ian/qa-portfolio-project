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

