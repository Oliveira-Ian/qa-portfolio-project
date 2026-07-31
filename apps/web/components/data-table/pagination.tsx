'use client';

import type { Table } from '@tanstack/react-table';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCount } from '@/lib/format';

interface PaginationProps<TData> {
  table: Table<TData>;
  testIdPrefix: string;
  pageSizeOptions?: number[];
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/**
 * Page navigation driven entirely by a TanStack `Table` instance's own
 * pagination state. `table.getRowCount()` is the server-reported total
 * (`useDataTable`'s `rowCount` option) — always correct for "Showing X–Y of
 * Z" and the page-size math, even though `table`'s own `data` only ever
 * holds the current page's rows.
 *
 * The selection summary (left side) replaces the range text once at least
 * one row is selected — it only ever has something to show on a screen
 * that enables selection at all (`DataTable`'s `enableSelection`); on one
 * that doesn't (Users), `rowSelection` simply never gets a key in it, so
 * this silently never renders instead of needing its own on/off prop.
 */
export function Pagination<TData>({
  table,
  testIdPrefix,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: PaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = Math.max(table.getPageCount(), 1);
  const rowCount = table.getRowCount();
  const selectedCount = table.getSelectedRowModel().rows.length;
  const rangeStart = rowCount === 0 ? 0 : pageIndex * pageSize + 1;
  const rangeEnd = Math.min(rowCount, (pageIndex + 1) * pageSize);

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3"
      data-testid={`${testIdPrefix}-pagination`}
    >
      <div className="min-w-0">
        {selectedCount > 0 ? (
          <div
            className="flex items-center gap-2"
            data-testid={`${testIdPrefix}-pagination-selection`}
          >
            <span className="tabular text-xs text-muted-foreground">
              {formatCount(selectedCount)} selected
            </span>
            <Button
              type="button"
              variant="link"
              size="xs"
              className="h-auto p-0 text-xs"
              onClick={() => table.resetRowSelection()}
              data-testid={`${testIdPrefix}-pagination-clear-selection`}
            >
              Clear
            </Button>
          </div>
        ) : (
          <span
            className="tabular text-xs text-muted-foreground"
            data-testid={`${testIdPrefix}-pagination-range`}
          >
            {rowCount === 0
              ? 'No records'
              : `Showing ${formatCount(rangeStart)}–${formatCount(rangeEnd)} of ${formatCount(rowCount)}`}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger
              className="h-8 w-[4.5rem]"
              data-testid={`${testIdPrefix}-pagination-page-size`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.setPageIndex(0)}
            aria-label="First page"
            data-testid={`${testIdPrefix}-pagination-first`}
          >
            <ChevronsLeft aria-hidden="true" />
          </Button>
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
            className="tabular px-1 text-xs text-muted-foreground"
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
          <Button
            variant="outline"
            size="icon-sm"
            disabled={!table.getCanNextPage()}
            onClick={() => table.setPageIndex(pageCount - 1)}
            aria-label="Last page"
            data-testid={`${testIdPrefix}-pagination-last`}
          >
            <ChevronsRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
