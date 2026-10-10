# Design — Layouts — The shell (global bar + sidebar)

The frame every signed-in page lives in — the Platform's own pages (`/home`, `/company/*`), Oliveira ERP
(`/erp/*`) and the Oliveira FSM placeholder (`/fsm`). One shell, three areas
(`docs/adr/0019`); the file keeps its old name so existing links still resolve. Platform screens:
`docs/design/layouts/platform.md`.

## Structure

- **Global bar** (`components/shell/global-bar.tsx`, 52px; 56px on mobile) — **Platform-owned and
  identical in every product**: the compact crest and "Oliveira", the **product switcher** (the product's
  name in its accent's 300 step; the menu lists every product with its access state), the **global
  search** (`Ctrl+Shift+F`), the company name, and the **account menu** (name, e-mail, the language
  switch, sign out).
- **Sidebar** (`components/shell/sidebar.tsx`, **product-owned**) — mono overlines for groups, 38px items;
  the active item has a filled background, a 3px accent marker, the accent on its icon and
  `aria-current="page"`. Items the account may not view are hidden; a direct link to one lands on the
  in-product "You can't view …" page.
- **Breadcrumbs** (`components/shell/breadcrumbs.tsx`) above the page, the product first and no repeated
  segment (the old ERP trail read "Records › People › Records › People").
- **Page header** (`components/layout/page-header.tsx`): breadcrumb, H1, a mono meta line, and the
  actions on the right (destructive-soft · secondary · primary, the primary rightmost).

`AppShell` (`components/shell/app-shell.tsx`) puts them together and sets `data-product` on the root, which
is what scopes the accent tokens. `ShellFor` is the bridge from a layout's Server Component: it reads
`GET /api/auth/me` (never the session cookie's copy), so the bar and the sidebar reflect a seat or a
profile change an administrator makes mid-session on the very next render, and hands over only plain data.

## Responsive (handoff § 6)

| Width | Shell | Content |
|---|---|---|
| ≥ 1280 | global bar, 232px sidebar | gutter 48 |
| 1024–1279 | sidebar becomes a 64px icon rail with tooltips | gutter 32 |
| 768–1023 | no sidebar — a drawer; search becomes an icon | gutter 32 |
| < 768 | bar 56: menu · crest · product · search · account; the drawer (320px) holds company, products, navigation and language | gutter 16; tables become card lists; controls 44px |

There is no manual sidebar toggle: the behaviour follows the width.

## Navigation is data

`apps/web/lib/navigation/nav.ts#buildNavigation(area, access)` returns the sections of each area's
sidebar, from:

- the **Platform**: Home, and — for a company admin only — Company, Members and Product access;
- the **ERP**: Overview, then the modules of `lib/navigation/catalog.ts` the account's permissions reach
  (`filterCatalogForAccount`) — the catalogue is the four-level Module → Group → Category → Routine
  structure of `docs/adr/0007`, and its URLs live under `/erp` (ADR 0019);
- the **FSM**: nothing — it is a placeholder.

Icons are component references, so the navigation is built inside the client shell: only serializable
data (`isCompanyAdmin`, `permissions`) crosses from the server. Every href is a typed value of
`lib/navigation/routes.ts#ROUTES`; nothing hand-types a URL.

## Guard states

- **No access to a product** (design S07/S08): `erp/layout.tsx` renders `NoProductAccess` with the global
  bar and **no** product sidebar. It never renders the page, so a URL typed straight in never shows the
  product; the API's `requireProductAccess` is the boundary.
- **No permission** (S09): inside the product shell, `NoPermission` explains that the ERP access profile
  doesn't include the View permission for the screen, and that this differs from product access.
- **Not a company admin**: `CompanyAdminGate` shows why `/company/*` isn't theirs.

## Global search and favorites

`components/shell/global-search.tsx` searches the screens of the **current area** (the navigation
above), not records. Each result can be opened in a new tab or favorited; favorites are
`localStorage`-only (`lib/navigation/favorites.ts`, a `useSyncExternalStore` over storage — keyed by
href, migrating the old unprefixed paths to `/erp/...`).

## Language

The `EN | PT` switch lives on the auth screens and in the account menu and the mobile drawer
(`components/shell/language-switch.tsx`). See `docs/design/i18n.md`.

`data-testid`s for this shell are listed in `docs/qa/testids.md` (the single source of truth for test
selectors — not duplicated here).
