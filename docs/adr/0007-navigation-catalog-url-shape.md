# 0007 — 4-level navigation catalog, 3-segment URLs

## Context

`apps/web/lib/navigation/catalog.ts` is a sealed catalog, Module → Group → Category → Routine, that
drives the sidebar, breadcrumb and global search — nothing renders a nav item or a URL outside it.
The migration's first pass built each routine's URL from all four levels
(`/records/people/records/people`, for People: module=`records`, group=`people`,
category=`records`, routine=`people`) and put the matching four-level folder nesting under
`apps/web/app/(dashboard)/`. For a catalog this shallow (one category per group, today), that
produced URLs with a visibly repeated segment and a page-file 9 directories deep — a cost that
multiplies with every routine added, not a one-time nuisance.

Two more things made this expensive to leave alone: `next.config.ts`'s redirects, `revalidatePath()`
calls, and `<Link href>`s all had the full four-segment path hand-typed at each of 42 call sites
across 22 files — renaming a catalog slug was a silent-404 risk, not a compiler error.

(The catalog's labels and URL slugs were originally in Portuguese — `/cadastros/pessoas/...` — and
were translated to English as part of the project's Language Standard,
`.claude/rules/rules-global.md`, after this ADR's decision was made. The shape this ADR decided
— three segments, not four — didn't change; only the words did. Examples below use today's
English slugs.)

## Decision

`flattenRoutines()`'s `href` is built from **Module/Group/Routine only** — Category stays part of the
catalog's data shape (and therefore the sidebar's flyout and the breadcrumb's middle segment), it
simply isn't a URL segment. The invariant this trades for brevity: `(module, group, routine)` must be
unique across the whole catalog, since two routines sharing a slug in the same group would now
collide on one URL where they wouldn't have before.

Every call site that used to hand-type a path now imports `ROUTES` from
`apps/web/lib/navigation/routes.ts` — hrefs derived once from the catalog's own slugs, not
re-spelled at each of the 42 sites. `next.config.ts` keeps permanent redirects for both the original
flat paths (`/people`, `/profiles`, `/users`) and the four-segment paths this migration's first pass
produced, so no bookmark from either era 404s.

## Consequences

- A routine's URL is three segments deep, not four — `/records/people/people` instead of
  `/records/people/records/people` — while the sidebar and breadcrumb still show all four
  catalog levels, unchanged.
- Renaming a catalog slug is now a `ROUTES` edit in one file; every consumer gets a compile error if
  the shape it expected changed, instead of a runtime 404.
- If a group ever grows a second category with routines of its own, the `(module, group, routine)`
  uniqueness invariant has to be checked by hand when adding it — nothing enforces it at compile
  time today. A collision would silently route to whichever entry `flattenRoutines()` returns first.
