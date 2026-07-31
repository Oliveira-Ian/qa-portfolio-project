'use client';

import type { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';

interface PaginationProps<TData> {
  table: Table<TData>;
  testIdPrefix: string;
}

/**
 * Page navigation driven entirely by a TanStack `Table` instance's own
 * pagination state — client-side today (the whole row set is already in
 * memory), but written against the table's public API rather than a local
 * page/size pair so switching `useDataTable` to `manualPagination` later
 * doesn't change this component at all.
 */
export function Pagination<TData>({ table, testIdPrefix }: PaginationProps<TData>) {
  const pageCount = Math.max(table.getPageCount(), 1);
  const pageIndex = table.getState().pagination.pageIndex;

  return (
    <div
      className="flex items-center justify-center gap-3 border-t border-border px-4 py-3"
      data-testid={`${testIdPrefix}-pagination`}
    >
      <Button
        variant="outline"
        size="sm"
        disabled={!table.getCanPreviousPage()}
        onClick={() => table.previousPage()}
        data-testid={`${testIdPrefix}-pagination-prev`}
      >
        Previous
      </Button>
      <span
        className="tabular text-xs text-muted-foreground"
        data-testid={`${testIdPrefix}-pagination-info`}
      >
        Page {pageIndex + 1} of {pageCount}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={!table.getCanNextPage()}
        onClick={() => table.nextPage()}
        data-testid={`${testIdPrefix}-pagination-next`}
      >
        Next
      </Button>
    </div>
  );
}
