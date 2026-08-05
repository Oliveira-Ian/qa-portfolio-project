---
paths:
  - 'apps/web/app/**/*.tsx'
  - 'apps/web/app/**/*.ts'
  - 'apps/web/components/**/*.tsx'
---

# Page Structure Pattern

The layered pattern every `apps/web` page under `app/(dashboard)/` follows. This is specifically
about `apps/web` — inside `apps/api`, a repository talks to Prisma directly (see "Data Access
Layer" in `.claude/rules/rules-global.md`); `apps/web` never imports `@prisma/client` at all. Its
`_data-access`/`_actions` call the separate API through `lib/api/*.ts` (a `fetch` wrapper), never a
database directly.

For the exact file tree, per-file responsibilities, and a real worked example, see
`docs/templates/new-routine.md` — People
(`apps/web/app/(dashboard)/records/people/people/`) is the reference implementation; read its files
over any prose description when the two disagree.

## What each layer does

### `page.tsx` — Server Component

- **Always** a Server Component.
- Fetches initial data through `_data-access` functions.
- Checks auth/permissions.
- Passes plain data down to client components — never a function or a component reference as a
  prop.
- Keeps server-only logic on the server.

### `_components/` — Page Components

- The leading `_` marks it a private folder — it never becomes a route.
- The main component is usually a **Client Component** (`"use client"`), needed when it has
  interactivity, React hooks, forms with validation, or animations/transitions.
- ✅ Handle interactivity, use hooks, hold local state.
- ❌ Don't fetch data directly.
- ❌ Don't call the API layer directly — go through an `_actions`/`_data-access` boundary.

### `_actions/` — Server Actions

- Always marked `"use server"`.
- Validates input with Zod (schemas live in `@oliveira/schemas`, shared with `apps/api`).
- Calls the API through `lib/api/*.ts` — never a database directly.
- Returns a typed `ActionResult` (`@/lib/actions`).
- ❌ Don't return sensitive data.

### `_data-access/` — Data Access Layer

- Always runs on the server (`import 'server-only'`).
- Wraps the call to `lib/api/*.ts` — don't duplicate its logic.
- Reusable across pages when the same data is needed in more than one place; use `cache()` from
  `react` for request-scoped dedup.
- Checks permissions, returns typed data.
- ❌ Don't expose sensitive data.

## Data flow

```
1. User visits the page
   ↓
2. page.tsx (Server Component)
   - Fetches data via _data-access
   - Checks auth
   ↓
3. <entity>-form.tsx (Client Component)
   - Receives data via props
   - Renders interactive UI
   - User interacts (fills a form, clicks a button)
   ↓
4. _actions (Server Action)
   - Validates input
   - Calls the API to update data
   - Returns a result
   ↓
5. <entity>-form.tsx
   - Receives the result
   - Updates the UI (toast, form errors, etc.)
```

## When to create each folder

- **`_components/`** — always, when the page needs UI.
- **`_actions/`** — when the page needs to change data (create, update, delete), with validation or
  non-trivial business logic.
- **`_data-access/`** — when the page needs to fetch data, especially complex or reusable queries.

# Component Placement Guidelines

## 1. Page-Level Components

Always check if there is a `_components` directory at the page or route level where you are
working. If the component is only used within this specific page or route, place it inside that
page's `_components` folder.

## 2. Global or Shared Components

If the component will be reused in multiple pages or modules, place it in the global
`apps/web/components/` directory (there is no `/src` directory in this project). Only add
components there when you're sure they will be reused broadly — if in doubt, ask first before
placing it globally.

## 3. Server vs. Client Component

Default to Server Components (no `"use client"` directive) whenever possible. Use Client Components
only when strictly necessary (state, effects, event handlers, etc.). If you're not sure, start as a
Server Component and refactor to Client only if required.

## 4. Other Best Practices

- Prefer colocating components near where they're used (feature or route-level scope) unless you
  have a clear case for global reuse.
- Review import paths after moving or adding components to avoid breaking references.
- **Always** name the folder as `_components` (with a leading underscore) to distinguish it from
  pages/routes.

# UI and Styling

- Use Shadcn UI for consistent, accessible component design.
- Integrate Radix UI primitives for customizable, accessible UI elements.
- Apply composition patterns to create modular, reusable components.
