# Design — Layouts — The Platform (Home and company administration)

The Platform is the system a signed-in user lands on: the products their company uses and their access to
each, and — for a company admin — the administration of the company. These are screens S03–S13 of the
Oliveira Platform handoff, adapted to what the backend and the ADRs actually do (**where a screen and an
ADR disagree about behaviour, the ADR wins** — the handoff says so itself). The shell around them:
`docs/design/layouts/dashboard.md`. The model behind them: `docs/product/access_control.md` and
`docs/especificacoes/platform-access-model.md`.

Everything lives under `apps/web/app/(platform)/` (the route group has no URL segment).

## Home — `/home` (S03–S06)

One page, four states, decided by the account's membership, its company role and its seats
(`GET /api/auth/me`):

- a **member** sees the product cards — whole-card links to the products they have a seat in; a product
  they don't is visible, disabled (`aria-disabled`, greyscale art, a lock) with a tooltip on hover and an
  inline message on tap or keyboard focus, and never opens; the FSM is "Coming soon";
- a **company admin** also sees the compact company strip (active members, ERP seats used of the limit)
  linking to the administration;
- an account with **no company** sees how to get into one. Nothing in the API creates a company
  (`docs/adr/0018`), so the design's "Create a company" is **not offered** — only "ask a company admin to
  add you with this e-mail", which the page shows. Creating an account grants no product access.

The greeting is the one place besides the auth screens that uses display type.

## Company administration — admins only

`CompanyAdminGate` (`components/platform/company-admin-gate.tsx`) wraps each page: a company admin gets the
page; anyone else gets an explanation inside the shell. Their `children` are never rendered otherwise, so
the page doesn't fetch what the API would refuse (`403`). The API enforces `requireCompanyAdmin` either way.

| Route | Screen | What it does |
|---|---|---|
| `/company` | Company (read-only) | Name, the contracts per product with status, licenses in use of the limit (`null` = unlimited). Nothing to edit: a limit is raised by Oliveira. |
| `/company/members` | Members (S10) | Search, Role and Status filters, sortable columns, a table (member, role tag, status, ERP access, FSM, joined), paging — all client-side, since the API returns every member at once. **Add member** opens a dialog. |
| `/company/members/:id` | Member details (S11) | The drawer, deep-linkable: role as radio cards, a switch per product, a link to manage permissions inside the ERP, **Deactivate / Reactivate**, Cancel · Save changes. |
| `/company/product-access/:product?` | Product access (S13) | Tabs per product, a switch per member, the licenses in use, an "N unsaved changes" line, Discard · Save changes. |

The drawer is part of the members page rather than a nested route: opening a member pushes
`/company/members/:id` with the History API (Next syncs `usePathname` with it), so the address, the back
button and a pasted link all agree, and the list keeps its search and page. A pasted link to an id that is
not a member of the company is a 404.

### Saving

Access is **never saved on toggle** (handoff § 4): a switch changes a draft and **Save changes** sends it.
`applySeatChanges` (`lib/api/company.ts`) applies **revocations before grants**, so moving a seat from one
member to another in a single save works at the licence limit; it stops at the first refusal and what was
applied before stays applied, and the screen refreshes either way so it shows the truth. The licence limit
is checked in the browser against what Save would leave in use (a clear message, Save disabled) and again by
the API (`409`, shown translated). A product with no active contract cannot be newly granted.

### Where the design was adapted to the ADRs

| Design | Built | Why |
|---|---|---|
| "Invite member": e-mail, role, access, "Send invitation" | **Add member**: e-mail only; role and access are set afterwards in the drawer | There are no invitations (ADR 0018): the API adds an existing, company-less account by e-mail and answers the same generic sentence whether or not one exists |
| Status "Invited", "pending invitations" | Active / Inactive only | There are no invitations |
| "Remove member" | **Deactivate / Reactivate** (`PATCH` status) | There is no removal endpoint; an inactive member opens no product and uses no seat |
| Company switcher | The company's name, static | One company per account until a switch exists |
| Admins listed on the "no access" screen | Omitted | The API exposes members only to admins; listing them needs a new endpoint — a backend decision, not made |
| FSM switch enabled | FSM always "Coming soon", its switch disabled (`PRODUCT_AVAILABILITY`, `lib/products.ts`) | The FSM has no features |

## Guard screens

- `NoProductAccess` — on a product URL without a seat: the global bar only, "You don't have access to
  {product}", back to Home.
- `NoPermission` — inside the ERP without the View permission for the screen (S09).
- `ErrorPanel` — the error boundaries (`(platform)/error.tsx`, `erp/error.tsx`, the root one): a message,
  a reference, "Try again"; the shell stays when the failure is inside a page.
- `app/not-found.tsx` — "There's nothing at this address".

`NoPermission` and the company-admin gate share `GuardPanel`; what differs is only the words.

## Data and actions

Reads go through `_data-access/` (`getCompanyMembers`, request-cached with `cache()`); writes are Server
Actions in `app/(platform)/company/_actions/`, validated with the Zod schemas of `@oliveira/schemas`
(`memberAddSchema`, `memberUpdateSchema`, `productSchema`), calling `lib/api/company.ts`, and ending in
`revalidateCompany()` (the members list, product access, the overview and Home all show the same seats).
Neither the token nor the API address ever reaches the browser.
