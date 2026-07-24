# Design — Layouts — Dashboard

Structure shared by every authenticated page (Home, Users, People, ...).

## Structure

- Fixed header (56px): sidebar toggle, logo (links to Home), user avatar + dropdown (About, SignOut) on the right.
- Fixed sidebar (240px), below the header: nav sections (e.g. "Settings" → Users, "Records" → People), active item highlighted by current route.
- Main content: pushed right by the sidebar width, holds a `content-card`-style container (`--bg-card`, `--radius-lg`, `--shadow-card`).

## Sidebar toggle

Clicking the header's hamburger button collapses/expands the sidebar (slides off-canvas); the main content's left margin adjusts to match.

## User dropdown

Avatar shows the first letter of the remembered user (`localStorage.rememberedUser`, falls back to "U"). Dropdown: "About" (no action), "SignOut" (redirect to `/login` — no session/token to clear, matching `docs/product/auth_rules.md`: this app has no real auth session today).

## Responsive

- `< 768px`: the sidebar becomes an overlay above the content instead of pushing it (no reserved margin).

## apps/web (Next.js)

`app/(dashboard)/layout.tsx` wraps every route in this group (`home`, `users`, `people`, ...) with `components/dashboard/dashboard-shell.tsx` (`'use client'` — holds sidebar-open state, active-route detection via `usePathname()`, and the user-menu). The dropdown uses shadcn/ui's `DropdownMenu` (Radix-based) instead of the legacy's manual open-class + outside-click listener — same behavior, standard accessible primitive.

`data-testid`s: `dashboard-header`, `dashboard-sidebar-toggle`, `dashboard-sidebar`, `dashboard-main`, `dashboard-nav-users`, `dashboard-nav-people` — new; the legacy sidebar links never had one (a pre-existing gap against `docs/qa/testids.md`'s own rule, not repeated here). `header-user-menu`, `header-user-avatar`, `header-user-dropdown`, `header-dropdown-about`, `header-dropdown-signout` are reused unchanged from the legacy markup.
