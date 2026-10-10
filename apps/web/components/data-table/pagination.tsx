'use client';

import type { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ListPagination } from '@/components/ui/list-pagination';
import { useT } from '@/lib/i18n/provider';

interface PaginationProps<TData> {
  table: Table<TData>;
  testIdPrefix: string;
  pageSizeOptions?: number[];
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/**
 * Page navigation driven entirely by a TanStack `Table` instance's own
 * pagination state, drawn by the shared `ListPagination` (summary · rows per
 * page · previous / numbers / next). `table.getRowCount()` is the
 * server-reported total (`useDataTable`'s `rowCount` option) — always correct
 * for "Showing X–Y of Z" and the page-size math, even though `table`'s own
 * `data` only ever holds the current page's rows.
 *
 * The selection summary replaces the range text once at least one row is
 * selected — it only ever has something to show on a screen that enables
 * selection at all (`DataTable`'s `enableSelection`); on one that doesn't
 * (Users), `rowSelection` simply never gets a key in it, so this silently never
 * renders instead of needing its own on/off prop.
 */
export function Pagination<TData>({
  table,
  testIdPrefix,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: PaginationProps<TData>) {
  const t = useT();
  const { pageIndex, pageSize } = table.getState().pagination;
  const selectedCount = table.getSelectedRowModel().rows.length;

  return (
    <ListPagination
      page={pageIndex + 1}
      pageSize={pageSize}
      total={table.getRowCount()}
      onPageChange={(page) => table.setPageIndex(page - 1)}
      onPageSizeChange={(size) => table.setPageSize(size)}
      pageSizeOptions={pageSizeOptions}
      testIdPrefix={testIdPrefix}
      summary={
        selectedCount > 0 ? (
          <span
            className="flex items-center gap-2"
            data-testid={`${testIdPrefix}-pagination-selection`}
          >
            <span>{t('table.selection.count', { count: selectedCount })}</span>
            <Button
              type="button"
              variant="link"
              size="xs"
              className="h-auto p-0 text-[13px]"
              onClick={() => table.resetRowSelection()}
              data-testid={`${testIdPrefix}-pagination-clear-selection`}
            >
              {t('table.selection.clear')}
            </Button>
          </span>
        ) : undefined
      }
    />
  );
}
