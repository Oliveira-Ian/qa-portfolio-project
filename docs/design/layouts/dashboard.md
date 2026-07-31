# Design — Layouts — Dashboard

Structure shared by every authenticated page (Home, People, Profiles, Users, ...).

## Structure

- Fixed header (56px): wordmark (links to Home), a centered global search field, theme toggle and user avatar + dropdown on the right. The sidebar's own toggle lives in the sidebar now, not here.
- Sidebar, below the header, **never fully hides** on any viewport — it's always at least the icon-only "compact" rail, which is what keeps its own toggle button reachable. Two widths: `compact` (64px, icons only) and `expanded` (240px, icon + label), persisted across visits.
- Main content: pushed right by the sidebar's current width on desktop; on mobile the sidebar's `expanded` state is a modal-like overlay (a backdrop dims the content) instead, since 240px would eat too much of a phone screen to push instead of cover.
- A breadcrumb trail sits above every page's own content, inside `main` — see "Breadcrumb" below.

The sidebar carries the product's mark — an oversized, barely-visible (5–7% opacity) olive tree bleeding off its bottom edge — as its one piece of brand signature, since "Oliveira" is Portuguese for olive tree.

## Sidebar: Módulo → Grupo → Categoria → Rotina

The sidebar's content is driven entirely by `apps/web/lib/navigation/catalog.ts` — a sealed, four-level catalog (same "const array + grouping helper" shape as `packages/schemas/src/permissions.ts`, one level deeper). Nothing renders a nav item, a URL, or a breadcrumb segment from anywhere else.

1. **Módulos** — the sidebar's primary column: one row per module (icon always, label when `expanded`).
2. **Grupos** — clicking a module swaps the column's own content to that module's groups (a "← Módulos" row at the top goes back). This is an in-place swap, not a flyout — the module context stays visible as you drill in.
3. **Categorias** — each Grupo row is the trigger for a flyout (`DropdownMenu`, opening to the right) listing its categories.
4. **Rotinas** — each Categoria is a `DropdownMenuSub` nested inside that same flyout, cascading further right with the final routine links. Clicking one navigates and closes the whole cascade.

Reusing `dropdown-menu.tsx`'s existing `DropdownMenuSub`/`DropdownMenuSubContent` for steps 3–4 means the flyout cascade needed zero new UI primitives — positioning, collision handling and keyboard navigation all come from Radix.

Every module/group/category/routine the account can't reach is pruned before it ever renders (`filterCatalogForAccount()`, run client-side inside `dashboard-shell.tsx` — see "Why client-side" below) — a group with zero visible routines underneath doesn't show up as an empty shell.

**Auto-collapse**: navigating to a new routine collapses the sidebar to `compact` automatically (a `pathname`-watching effect in `app-sidebar.tsx`, skipped on the very first render to avoid fighting the mode `localStorage` already restored). Re-expanding is manual, via the sidebar's own toggle.

**Why client-side**: `filterCatalogForAccount()` and `flattenRoutines()` run inside `dashboard-shell.tsx` (`'use client'`), not the server `layout.tsx` — each `RoutineDefinition.icon` is a `LucideIcon` component reference, and functions can't cross the Server→Client props boundary the way plain data can. The server layout hands down only serializable data (`isAdmin`, `permissions`); the client tree does the filtering itself.

## Breadcrumb

`apps/web/components/layout/breadcrumb-trail.tsx`, built on the new `components/ui/breadcrumb.tsx` primitive, renders "Início > Módulo > Grupo > Categoria > Rotina" above every page's content. Only "Início" (→ `/home`) and the current Rotina are real links — a Módulo/Grupo/Categoria isn't a route of its own, just a grouping the sidebar drills through, so those render as plain text. Renders nothing outside the catalog (e.g. on `/home` itself).

## Global search

`apps/web/components/layout/global-search.tsx`, opened by clicking the header's search field or `Ctrl+Shift+F` (a `keydown` listener, `event.preventDefault()`'d so it doesn't fight the browser's own shortcuts). Built on `cmdk`'s headless `Command` primitive (its own filtering disabled — `shouldFilter={false}` — in favor of a simple case-insensitive substring match over the already-access-filtered routine list, so results and highlighting stay predictable) inside the existing `Dialog`. Searches only the navigation catalog (screen titles), not application data — there's no full-text index of records.

Each result row: the routine's module icon, its label with the matched substring highlighted, a "Screen" type badge (the only type that exists today — the shape allows "Report"/"Action" later), an "open in new tab" button (`window.open`), and a favorite toggle. Both trailing buttons `stopPropagation()` so they don't also trigger the row's own select-and-navigate.

## Favorites

`apps/web/lib/navigation/favorites.ts` — `useFavorites()`, built on `useSyncExternalStore` over `localStorage` (not a `useEffect` racing to correct a default after mount, which is what a naive "read `localStorage` on mount" implementation looks like and is exactly what `useSyncExternalStore` exists to replace). `localStorage`-only for now, keyed by a routine's full `href` — per-account persistence would need a table and an API, not built yet. Used today from the global search's result rows.

## Sidebar mode persistence

`apps/web/lib/navigation/sidebar-preference.ts` — `useSidebarMode()`, the same `useSyncExternalStore`-over-`localStorage` shape as favorites. Defaults to `expanded` during SSR (no `localStorage` to read yet) and corrects on the client after hydration — a `useSyncExternalStore` server/client snapshot split, not a hydration-mismatch-prone `useState` default.

## User dropdown

Avatar shows the first letter of the signed-in user's name, from the session (`apps/web/lib/session.ts`) — not `localStorage`. Dropdown: "Notifications" (a placeholder — no feed exists yet, but the icon + counter badge affordance is there for when one does, always reading 0), "About" (no action, closes the menu like any other item), "Sign out" (a Server Action that clears the session cookie and redirects to `/login`).

## Responsive

- `< 768px`: the sidebar stays as the compact rail by default; toggling to `expanded` becomes a modal-like overlay (a dismissible backdrop covers the content) instead of pushing it, since `main`'s padding only grows to accommodate the wider sidebar at the `md` breakpoint and up.

## apps/web (Next.js)

`app/(dashboard)/layout.tsx` is a Server Component that calls `requireSession()` (the actual auth check — `proxy.ts` only checks that a cookie exists) and passes serializable session data (name, e-mail, `isAdmin`, `permissions`) into `components/layout/dashboard-shell.tsx` (`'use client'`, owns the sidebar's expanded/compact mode and derives the filtered catalog from those props). The shell composes `app-header.tsx` (→ `global-search.tsx`, `theme-toggle.tsx`, `user-menu.tsx`), `app-sidebar.tsx` (→ `sidebar-toggle.tsx`), and `breadcrumb-trail.tsx`.

`data-testid`s for this shell are listed in `docs/qa/testids.md` (the single source of truth for
test selectors — not duplicated here).
