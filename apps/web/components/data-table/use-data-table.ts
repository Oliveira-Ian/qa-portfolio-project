'use client';

import { useEffect, useRef, useState } from 'react';
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import type { ListQueryState } from '@/lib/list-query';

export interface UseDataTableOptions<TData> {
  /** Already the current page's rows — the API did pagination, sorting and filtering. */
  data: TData[];
  columns: ColumnDef<TData>[];
  getRowId: (row: TData) => string;
  /** Total rows across every page — `Pagination` needs this, not `data.length`. */
  rowCount: number;
  /** Parsed from the URL by `useListNavigation` — the single source of truth for page/sort/filter/search. */
  query: ListQueryState;
  /** Navigates to the URL a table-state change implies — see `useListNavigation`. */
  onQueryChange: (patch: Partial<ListQueryState>) => void;
  enableMultiRowSelection?: boolean;
  /** From a saved `GridColumnPreference`, if the account has one for this grid — falls back to every column visible. */
  initialColumnVisibility?: VisibilityState;
  initialColumnOrder?: string[];
}

/**
 * A table-state change now navigates (`onQueryChange` → `router.push`), and
 * every keystroke in a text filter or the search box would otherwise fire
 * its own full navigation — the last one to land wins the race, so typing
 * "person" could end up searching for just "n". Typed input is debounced
 * before it reaches `onQueryChange`; a click (sort, page, a boolean/enum
 * filter) still navigates immediately, since debouncing a single discrete
 * action would only add a delay with no race to prevent.
 */
const TYPING_DEBOUNCE_MS = 400;

function useDebouncedPatch(onQueryChange: (patch: Partial<ListQueryState>) => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (patch: Partial<ListQueryState>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => onQueryChange(patch), TYPING_DEBOUNCE_MS);
  };
}

/**
 * The defaults every listing screen shares. Sorting, filtering and
 * pagination are all `manual*: true` — the API already returned exactly
 * the rows for the current page in the current order (`docs/design/patterns/listing_pages.md`),
 * so TanStack doesn't derive a row model from a larger set the way it would
 * client-side; it only needs `getCoreRowModel()`. State for those three
 * lives in the URL (`query`, owned by `useListNavigation`), not local
 * `useState` — only selection and column show/hide/order stay local here,
 * since neither belongs in a shareable link the way a filter or a page
 * number does.
 *
 * The search box and column filters still need *some* local state
 * (`searchDraft`/`filtersDraft`) so a keystroke shows up instantly instead
 * of waiting on the debounced navigation — both resync from `query`
 * whenever it changes for a reason other than local typing (a page
 * navigation, "Clear all", browser back/forward).
 */
export function useDataTable<TData>({
  data,
  columns,
  getRowId,
  rowCount,
  query,
  onQueryChange,
  enableMultiRowSelection = true,
  initialColumnVisibility,
  initialColumnOrder,
}: UseDataTableOptions<TData>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialColumnVisibility ?? {},
  );
  const [columnOrder, setColumnOrder] = useState<string[]>(initialColumnOrder ?? []);
  const [searchDraft, setSearchDraft] = useState(query.search);
  const [filtersDraft, setFiltersDraft] = useState<ColumnFiltersState>(query.filters);
  const debouncedQueryChange = useDebouncedPatch(onQueryChange);

  useEffect(() => {
    setSearchDraft(query.search);
  }, [query.search]);

  useEffect(() => {
    setFiltersDraft(query.filters);
  }, [query.filters]);

  const sorting: SortingState = query.sortBy
    ? [{ id: query.sortBy, desc: query.sortOrder === 'desc' }]
    : [];
  const pagination = { pageIndex: query.page - 1, pageSize: query.pageSize };

  const table = useReactTable({
    data,
    columns,
    getRowId,
    enableMultiRowSelection,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    rowCount,
    state: {
      sorting,
      columnFilters: filtersDraft,
      globalFilter: searchDraft,
      rowSelection,
      columnVisibility,
      columnOrder,
      pagination,
    },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      const first = next[0];
      // A new sort starts back at page 1 — the old page number is
      // meaningless once the order underneath it has changed.
      onQueryChange({ sortBy: first?.id, sortOrder: first?.desc ? 'desc' : 'asc', page: 1 });
    },
    onColumnFiltersChange: (updater) => {
      const next: ColumnFiltersState =
        typeof updater === 'function' ? updater(filtersDraft) : updater;
      setFiltersDraft(next);
      debouncedQueryChange({ filters: next, page: 1 });
    },
    onGlobalFilterChange: (value: string) => {
      setSearchDraft(value);
      debouncedQueryChange({ search: value, page: 1 });
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater(pagination) : updater;
      const pageSizeChanged = next.pageSize !== pagination.pageSize;
      onQueryChange({
        // Changing the page size while on page 4 of the old size can leave
        // no such page under the new size — safer to land back on page 1.
        page: pageSizeChanged ? 1 : next.pageIndex + 1,
        pageSize: next.pageSize,
      });
    },
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
  });

  return table;
}
