# Use a Modular File Structure:

Use the /app directory for routing (App Router) with Next.js 16 or version provided.
Keep business logic separate from UI components.
Organize `apps/web` with clear directories: `components/` (shared UI, e.g. `components/ui`,
`components/data-table`), `lib/` (data-access clients, session, formatting, navigation), and
Tailwind CSS for styling (no separate `/styles` directory). There is no top-level `/hooks` or
`/services` directory — feature-specific hooks live next to the feature that uses them (e.g.
`components/people/use-person-form.ts`), and API calls live in `lib/api/`.

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
The Server Component / Client Component / Server Action / Data Access layering itself — what each
layer is responsible for, and the request-to-response flow through them — lives in
`.claude/rules/nextjs-page-pattern.md`, which only loads while working under `apps/web/app/**` or
`apps/web/components/**`.

**Planned restructuring, not yet built:** the Foundation roadmap (item 23, "Camada de identidade")
plans to replace the current 1:1 `Person`/`AccessAccount` link with a global account plus a
per-company association. That decision is still pending — `Person` remains the current, real model
described above and in `docs/templates/new-routine.md`. Don't build against the future shape yet.

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

# Security and Authentication

This project does **not** use Supabase. Auth is a self-hosted JWT session (`jose`, `apps/api/src/modules/auth/token.ts`)
issued by `POST /api/auth/login`, passwords hashed with bcrypt (`apps/api/src/modules/auth/password.ts`),
and the token is stored in an **httpOnly** cookie by a Server Action — never read by client
JavaScript, never sent from the browser to the API directly. See `docs/product/access_control.md`
for the full role/permission model.

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

# Branch Naming

Branches follow `<type>/<issue-number>-<slug>` (see `docs/process/development-workflow.md`). When
creating a branch for work that has no GitHub issue yet, use `0` as the issue number —
e.g. `chore/0-session-start-git-context` — instead of inventing another placeholder. File the issue
retroactively and rename the branch once one exists.
