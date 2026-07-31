# 0005 — `data-table/` state is client-side until the API needs otherwise

## Context

`components/data-table/` (`useDataTable`, `DataTable`, `Pagination`, `FilterDrawer`, …) is the shared
listing infrastructure behind People, Perfis and Usuários. Sorting, filtering (both the per-column
`ColumnFilter` and the toolbar's global search), row selection and pagination all need to live
somewhere. None of `GET /api/persons`, `GET /api/profiles`, `GET /api/accounts` support
`skip`/`take`/`sort`/`filter` query params today — each returns its full result set in one call.

## Decision

`useDataTable` wraps TanStack Table with every piece of that state kept **client-side**: the whole
row set for a listing is fetched once (server-side, in the routine's `page.tsx`) and handed to the
table already in memory; sorting/filtering/pagination all operate on that in-memory array via
TanStack's default row models (`getFilteredRowModel`, `getSortedRowModel`, `getPaginationRowModel`).
`ToolbarList`'s "Refresh" is a plain `router.refresh()` specifically *because* none of that state
lives on the server to lose — re-running the page's own data fetch doesn't disturb the sort/filter/
selection a user has mid-flight.

The component is written against TanStack's public table-instance API (`table.getPageCount()`,
`table.getState().columnFilters`, …), not a bespoke page/size pair — the seam for
`manualPagination`/`manualFiltering`/`manualSorting` is `useDataTable`'s own options object, not
something every consuming component would need to know about.

## Consequences

- No routine's list page needs to think about server-side paging at all today — one call, one
  in-memory table.
- This doesn't scale to a resource with tens of thousands of rows — the whole set has to fit in a
  page load and in memory. Fine for Pessoas/Perfis/Usuários at current and expected volumes; a
  future high-cardinality resource (an audit log, a transaction history) would need
  `manualPagination` turned on in `useDataTable`, and the API would need `skip`/`take` first.
- When that day comes, the change is isolated to `useDataTable` and the API's list endpoints — not a
  rewrite of `DataTable`, `Pagination`, `FilterDrawer`, or any routine's own `columns`/`filterFields`,
  since none of them talk to TanStack's row-model internals directly.
