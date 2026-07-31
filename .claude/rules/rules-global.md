# Use a Modular File Structure:

Use the /app directory for routing (App Router) with Next.js 16 or version provided.
Keep business logic separate from UI components.
Organize `apps/web` with clear directories: `components/` (shared UI, e.g. `components/ui`,
`components/data-table`), `lib/` (data-access clients, session, formatting, navigation), and
Tailwind CSS for styling (no separate `/styles` directory). There is no top-level `/hooks` or
`/services` directory — feature-specific hooks live next to the feature that uses them (e.g.
`components/people/use-person-form.ts`), and API calls live in `lib/api/`.

# App Router Best Practices:

Use file-based routing for cleaner code organization.
Utilize Next.js server components for improved performance where possible.
Keep client components focused on state management and UI interactions.

# Data Access Layer (DAL) and Services:

Avoid mixing data fetching logic directly in components.

This project's ORM is **Prisma** — always Prisma, never Drizzle or any other ORM/query builder.
`apps/api`'s repositories are the only layer that imports `@prisma/client`
(see `apps/api/src/config/prisma.ts`); nothing above them knows Prisma is underneath.

# Directory Structure for DAL:

Use a consistent folder structure for data access and actions within each page module — file names
are semantic and descriptive (e.g. `person-list.tsx`, `create-profile-form.tsx`,
`get-grid-preferences.ts`), never a generic name like `content.tsx`:

- app/
  - (dashboard)/
    - records/people/people/
      - `_components/` # UI for the routine — e.g. `person-list.tsx`, `person-columns.tsx`
      - `_data-access/` # Data Access Layer (DAL) for the routine
      - `_actions/` # Server Actions for the routine

Always use the underscore-prefixed form (`_components`, `_data-access`, `_actions`) — Next.js treats
a leading `_` as a private folder that never becomes a route. This is the one convention used
throughout the codebase; a folder without the underscore is not a variant, it's a typo.

Full file tree, per-file responsibilities, and a worked example: `docs/templates/new-routine.md`
(People — `apps/web/app/(dashboard)/records/people/people/` — is the reference implementation).

# Page Structure Pattern

The layered pattern every `apps/web` page under `app/(dashboard)/` follows, in more depth than the
quick reference above. This is specifically about `apps/web` — inside `apps/api`, a repository talks
to Prisma directly (see "Data Access Layer" above); `apps/web` never imports `@prisma/client` at all.
Its `_data-access`/`_actions` call the separate API through `lib/api/*.ts` (a `fetch` wrapper), never
a database directly. That's the one thing the examples below depend on getting right.

## Base structure

```
/route-name/
├── page.tsx                    # Server Component (entry point)
├── _components/                # Page-specific components
│   └── <entity>-form.tsx       # Main Client Component — named for what it does, never `content.tsx`
├── _actions/                    # Server Actions
│   └── update-<entity>.ts
└── _data-access/                # Data Access Layer
    └── get-<entity>.ts
```

## What each layer does

### 1. `page.tsx` — Server Component

- **Always** a Server Component.
- Responsible for:
  - Fetching initial data through `_data-access` functions
  - Checking auth/permissions
  - Passing data down to client components
  - Keeping server-only logic on the server

**Example:**

```typescript
// page.tsx
import { AccountForm } from './_components/account-form';
import { getAccountData } from './_data-access/get-account-data';

export default async function Page() {
  const account = await getAccountData();

  return <AccountForm account={account} />;
}
```

### 2. `_components/` — Page Components

- Holds components specific to this page.
- The leading `_` marks it a private folder — it never becomes a route.
- Components can be Client or Server Components depending on what they need.

#### Main component — named for what it does

- Usually a **Client Component** (`"use client"`).
- Needed when the component has:
  - Interactivity (onClick, onChange, etc.)
  - React hooks (useState, useEffect, etc.)
  - Forms with validation
  - Animations and transitions

**Example:**

```typescript
// _components/account-form.tsx
"use client";

import { useState } from "react";
import { updateAccountAction } from "../_actions/update-account";

export function AccountForm({ account }) {
  const [state, setState] = useState();

  // Component logic…

  return (
    <div>
      {/* Component UI */}
    </div>
  );
}
```

### 3. `_actions/` — Server Actions

- Holds the Server Actions specific to this page.
- Always marked `"use server"`.
- Responsible for:
  - Validating input with Zod (schemas live in `@oliveira/schemas`, shared with `apps/api`)
  - Calling the API through `lib/api/*.ts` — never a database directly
  - Returning a typed `ActionResult` (`@/lib/actions`)

**Example** (matches the real shape of
`apps/web/app/(dashboard)/records/people/people/new/_actions/create-person.ts`):

```typescript
// _actions/update-account.ts
'use server';

import { revalidatePath } from 'next/cache';
import { accountFormSchema, type AccountFormValues } from '@oliveira/schemas';
import { requestAccountUpdate } from '@/lib/api/accounts';
import type { ActionResult } from '@/lib/actions';
import { requireSession } from '@/lib/session';

export async function updateAccountAction(values: AccountFormValues): Promise<ActionResult> {
  const { token } = await requireSession();
  const parsed = accountFormSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid data' };
  }

  const result = await requestAccountUpdate(token, parsed.data);

  if (!result.success) {
    return { success: false, message: result.error };
  }

  revalidatePath('/account');
  return { success: true, message: 'Updated successfully' };
}
```

### 4. `_data-access/` — Data Access Layer

- Holds functions that fetch data.
- Always runs on the server.
- Wraps the call to `lib/api/*.ts` — never a database directly.
- Reusable across pages when the same data is needed in more than one place.

**Example** (matches the real shape of
`apps/web/app/(dashboard)/records/people/people/_data-access/get-grid-preferences.ts`):

```typescript
// _data-access/get-account-data.ts
import 'server-only';

import { cache } from 'react';
import { unwrap } from '@/lib/api/client';
import { requestAccount } from '@/lib/api/accounts';
import { requireSession } from '@/lib/session';

export const getAccountData = cache(async () => {
  const { token } = await requireSession();
  return unwrap(await requestAccount(token));
});
```

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

## Best practices

### Server Components (`page.tsx`)

- ✅ Fetch data directly (through `_data-access`)
- ✅ Access server-only resources
- ✅ Keep sensitive information on the server
- ❌ Don't use React hooks
- ❌ Don't use event handlers

### Client Components (`_components/*`)

- ✅ Handle interactivity
- ✅ Use React hooks
- ✅ Hold local state
- ❌ Don't fetch data directly
- ❌ Don't call the API layer directly — go through an `_actions`/`_data-access` boundary

### Server Actions (`_actions/`)

- ✅ Validate every input
- ✅ Check authentication
- ✅ Return a consistent, typed result (`ActionResult`)
- ✅ Handle errors properly
- ❌ Don't return sensitive data

### Data Access (`_data-access/`)

- ✅ Wrap the API call, don't duplicate its logic
- ✅ Reuse common logic (`cache()` for request-scoped dedup)
- ✅ Check permissions
- ✅ Return typed data
- ❌ Don't expose sensitive data

## Complete example: `/account`

```
/account/
├── page.tsx
│   └── Server Component
│       └── Calls getAccountData()
│       └── Renders <AccountForm />
│
├── _components/
│   └── account-form.tsx
│       └── Client Component
│       └── Interactive form
│       └── Calls updateAccountAction()
│
├── _actions/
│   └── update-account.ts
│       └── Server Action
│       └── Validates with Zod
│       └── Calls the API through lib/api/*.ts
│
└── _data-access/
    └── get-account-data.ts
        └── Fetches account data
        └── Checks authentication
```

## When to create each folder

### `_components/`

- **Always** when the page needs UI.
- Page-specific components.
- Can hold multiple components.

### `_actions/`

- When the page needs to **change data** (create, update, delete).
- Operations that need validation.
- Non-trivial business logic.

### `_data-access/`

- When the page needs to **fetch data**.
- Complex or reusable queries against the API.
- Shared data-access logic.

## Key notes

1. **`_` prefix**: folders starting with `_` never become routes in Next.js.
2. **Separation of concerns**: each layer has one job.
3. **Typing**: always type function inputs and outputs.
4. **Validation**: use Zod (`@oliveira/schemas`) to validate data before it leaves the client.
5. **Security**: always check authentication in `_actions` and `_data-access`.

# Component Placement Guidelines

## 1. Page-Level Components

- **Always check** if there is a `_components` directory at the page or route level where you are working.
  - Example:
    ```
    /app
      /dashboard
        /_components
        page.tsx
    ```
  - What to do:
    If the component is only used within this specific page or route (e.g., only in `/dashboard`), place it inside the `/dashboard/_components` folder.

## 2. Global or Shared Components

- If the component will be reused in multiple pages or modules, place it in the global
  `apps/web/components/` directory (there is no `/src` directory in this project).
  - Only add components to `apps/web/components/` when you're sure they will be reused broadly.
  - If in doubt, always ask first before placing it globally.

## 3. Server vs. Client Component

- Default to Server Components (no `"use client"` directive) whenever possible.
  - Use Client Components (`"use client"`) **only when strictly necessary** (state, effects, event handlers, etc.).
  - If you're not sure, start as a Server Component and refactor to Client only if required.

## 4. Other Best Practices

- Prefer colocating components near where they're used (feature or route-level scope) unless you have a clear case for global reuse.
- Keep component directories organized and use descriptive names.
- Review import paths after moving or adding components to avoid breaking references.
- **Always** name the folder as `_components` (with a leading underscore) to distinguish it from pages/routes.

# Reusable and Isolated Components:

Keep components small and focused on a single responsibility.
Use props effectively and avoid excessive prop drilling by leveraging context or hooks where needed.

# Separation of Concerns:

Avoid placing API calls or business logic inside components.
Use hooks for state management and side effects (e.g., useSWR, React Query, custom hooks).

# UI and State Separation:

Keep UI components presentational (no logic other than rendering).
Use containers for data management and complex state logic.
Code Quality

# UI and Styling

Component Libraries

- Use Shadcn UI for consistent, accessible component design.
- Integrate Radix UI primitives for customizable, accessible UI elements.
- Apply composition patterns to create modular, reusable components.

# TypeScript First:

Use TypeScript to ensure type safety across the application.
Define strict types for props, state, and API responses.

# Clean Code Principles:

Follow SOLID principles where applicable.
Use meaningful variable names and avoid magic numbers.
Prefer functional components and hooks over class components.

# Avoid Anti-Patterns:

No large, monolithic components.
Avoid inline styles in favor of TailwindCSS or modular CSS.
Performance Optimization

# Code Splitting and Lazy Loading:

Use dynamic imports for large components to improve load times.
Optimize for faster Time to Interactive (TTI).

# Server Components

- Default to Server Components
- Use URL query parameters for data fetching and server state management
- Use 'use client' directive only when necessary:
- Event listeners
- Browser APIs
- State management
- Client-side-only libraries

# Specific Naming Patterns

- Prefix event handlers with 'handle': handleClick, handleSubmit
- Prefix boolean variables with verbs: isLoading, hasError, canSubmit
- Prefix custom hooks with 'use': useAuth, useForm
- Use complete words over abbreviations except for:
- err (error)
- req (request)
- res (response)
- props (properties)
- ref (reference)

# Language Standard — English for Everything Technical

Decided 2026-07-30, after the app's navigation catalog (sidebar/breadcrumb/search)
and its URLs turned out to be entirely in Portuguese while the rest of the app
(forms, tables, toasts, home page, and every code identifier) was already English —
an inconsistency that had never been written down as a rule.

**English is the only language for anything technical**, no exceptions: folder and
file names, route/URL slugs, components, hooks, services, types, interfaces,
constants, variables, function names, database column/model names, and seeded data
values (e.g. profile names). This was already true almost everywhere in the codebase
before this rule existed — this section makes it explicit and permanent so it never
drifts back.

**Display text shown to the user is also English for now.** A future i18n phase may
introduce a language switcher for end-user-facing text — that is a separate,
deliberate project, not something to bolt on ad hoc. Until that phase exists, do not
add Portuguese strings anywhere, including a "just this one label" exception — the
last time that happened (the navigation catalog), it silently became the only
Portuguese surface in an otherwise all-English app.

Portuguese business/domain vocabulary may still appear as prose in comments or docs
when it's genuinely clearer that way (e.g. explaining a Brazil-specific document
rule), but never as an identifier, file/folder name, route segment, or user-facing
string.

**The one exception is conversation itself** — talk with the user in whatever language
they use with Claude (Portuguese, in practice). This rule is only about what ends up
in the codebase.

# Form - Required form template.

- All forms must use inputs following ShadcnUI with React hook form and data validation with ZOD.
- Required reference: https://ui.shadcn.com/docs/forms/react-hook-form

# Testing Strategy:

This project uses **Vitest** (`tests/unit/`, pure logic) and **Playwright** (`tests/api/`,
`tests/e2e/`) — not Jest or React Testing Library. See `docs/qa/testing-status.md` for what's
currently active versus temporarily disabled, and do not write or repair automated tests unless
explicitly asked to — the full testing strategy is a deliberate, separate phase of this project.

# Local Development Servers — Ports & Workflow

Fixed pairing, matches `docs/index.md`'s Quick Start and `apps/web/lib/api/client.ts`'s default
`API_URL`:

- `apps/web` → **http://localhost:3000**
- `apps/api` → **http://localhost:3001**

To bring both up from the repo root:

```bash
PORT=3001 npm run dev -w apps/api    # http://localhost:3001
npm run dev -w apps/web              # http://localhost:3000
```

Before starting, check nothing stale already holds these ports — a leftover process from an earlier
session silently serves outdated code (it won't reflect changes made since it started, and won't
necessarily fail obviously; a stale server can still answer `/health` and render pages, just with old
behavior) — and duplicate/orphaned dev-server processes competing for CPU and memory are the single
most common cause of the whole system feeling slow, independent of anything in the code:

```bash
npm run dev:doctor
```

Runs `scripts/dev-doctor.ps1` — reports which PID actually owns ports 3000/3001, its memory, and
flags (a) unusually high memory (>300MB) on a listener, and (b) any other node.exe process matching
a `next dev` / `tsx watch src/server.ts` / `npm run dev -w apps/(web|api)` command line that isn't
part of either listening process's tree — i.e. an orphaned duplicate from a server that was never
cleanly stopped. It's read-only; it never kills anything itself.

**Run `npm run dev:doctor` after every code change to this project (not just proposing one), before
telling the user the system is ready to test.** Interpret what it reports and clean up anything it
flags (`taskkill //F //PID <pid>`) before restarting — don't restart blindly without looking first,
and don't leave a flagged duplicate/high-memory process running just because the ports already
respond. Then bring `apps/web` and `apps/api` back up and leave them running at
`http://localhost:3000`/`:3001` so the user can immediately test in a browser — don't stop them at
the end of a task unless asked to. If they were already running before the change, restart both
rather than trust hot-reload: Next's dev server usually picks up file changes on its own, but a
change to `next.config.ts`, an env file, or anything in `apps/api` (no hot-reload there) needs a real
restart to actually be served — and `npm run dev:doctor` is exactly how to confirm the restart
actually took (new PID, normal memory) rather than assuming it did.

A `next dev` (Turbopack) process for `apps/web` running several hundred MB to ~1GB at idle, even
seconds after a fresh start, is this project's normal baseline in this environment — not a leak from
a code change. `dev:doctor`'s >300MB flag on a _freshly restarted_ listener is expected noise, not a
signal something is wrong; it's there to catch a listener that keeps _climbing_ across a session, or
a genuine duplicate process, not to flag Turbopack's own footprint.

# Documentation:

Use JSDoc or TypeScript comments to describe component props and functions.
Keep README files updated for each module or library used.
Security and Best Practices

# Environment Variables:

Use .env files for secrets and configuration.
Never expose sensitive keys in the frontend.

# Input Validation and Sanitization:

Use Zod for schema validation to prevent bad data.
Sanitize all inputs to prevent XSS and SQL injection.

# Authentication and Authorization:

This project does **not** use Supabase. Auth is a self-hosted JWT session (`jose`, `apps/api/src/modules/auth/token.ts`)
issued by `POST /api/auth/login`, passwords hashed with bcrypt (`apps/api/src/modules/auth/password.ts`),
and the token is stored in an **httpOnly** cookie by a Server Action — never read by client
JavaScript, never sent from the browser to the API directly. See `docs/product/access_control.md`
for the full role/permission model.
Deployment and Scalability

# Optimized Build Process:

Use the latest Next.js features for optimized builds.
Leverage Vercel or a VPS with good caching strategies.

# Logging and Error Handling:

Use tools like Sentry for error tracking and performance monitoring.
Implement graceful error handling with fallback components.

# Scaling Strategies:

Plan for horizontal scaling with serverless or containerized deployments.
Optimize database queries with Prisma for efficient data access.
Continuous Improvement

# Code Reviews and PR Guidelines:

Set clear code review guidelines to catch issues early.
Use pull request templates to ensure consistency.

# Performance Audits:

Regularly run Lighthouse and Web Vitals checks.
Use performance monitoring tools to track improvements.
