'use client';

import { useState } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';

export interface UseDataTableOptions<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  getRowId: (row: TData) => string;
  enableMultiRowSelection?: boolean;
  /** From a saved `GridColumnPreference`, if the account has one for this grid — falls back to every column visible. */
  initialColumnVisibility?: VisibilityState;
  initialColumnOrder?: string[];
}

/**
 * The defaults every listing screen shares: client-side sorting, filtering
 * (both the per-column `ColumnFilter` and `ToolbarList`'s global search feed
 * the same `columnFilters`/`globalFilter` state) and pagination — the API has
 * no `skip`/`take` yet, see `docs/design/patterns/listing_pages.md`. Swapping
 * to server-side pagination later means adding `manualPagination` here, not
 * changing any component that calls this hook.
 */
export function useDataTable<TData>({
  data,
  columns,
  getRowId,
  enableMultiRowSelection = true,
  initialColumnVisibility,
  initialColumnOrder,
}: UseDataTableOptions<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialColumnVisibility ?? {},
  );
  const [columnOrder, setColumnOrder] = useState<string[]>(initialColumnOrder ?? []);
  // Must be controlled, not left to TanStack's internal default: its
  // "reset page index on data/filter change" logic calls this setter
  // synchronously while computing the row model during render. Left
  // uncontrolled, that update targets TanStack's own internal state holder
  // rather than a hook owned by this component, which React sees as an
  // update on a component that hasn't mounted yet. Owning the state here
  // makes it the same kind of same-render adjustment as any other state
  // above, which React allows.
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const table = useReactTable({
    data,
    columns,
    getRowId,
    enableMultiRowSelection,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
      columnVisibility,
      columnOrder,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Forces the row model (and TanStack's own "reset page index when data/
  // filters change" side effect inside it) to compute here, in the render of
  // the component that owns `pagination`'s `useState` — not deferred to
  // whichever child (`DataTable`) happens to call `table.getRowModel()`
  // first. That deferral is what caused the "hasn't mounted yet" warning:
  // the setState call belongs to this component, but was firing from a
  // child's render instead of this one.
  table.getRowModel();

  return table;
}
