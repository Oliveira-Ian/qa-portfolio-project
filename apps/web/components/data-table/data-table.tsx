'use client';

import type { ReactNode } from 'react';
import { flexRender, type Table as TanstackTable } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { useT } from '@/lib/i18n/provider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DataTableProps<TData> {
  table: TanstackTable<TData>;
  testIdPrefix: string;
  emptyState: { title: string; description: string; action?: ReactNode };
  /** Off for tables that don't select rows at all (none yet — every listing screen selects). */
  enableSelection?: boolean;
  /**
   * Opens a record — its view page — on a double click or Enter on the row.
   * There are no per-row actions: editing and deleting act on the selection,
   * from the page header (docs/design/patterns/listing_pages.md).
   */
  onRowOpen?: (row: TData) => void;
  /**
   * Feeds the row checkbox's `aria-label` and the row's own — e.g. a
   * person's name, an account's email. Falls back to the row id (still
   * better than nothing for a routine that hasn't been updated yet, but a
   * screen reader announcing a raw UUID isn't useful) when omitted.
   */
  getRowLabel?: (row: TData) => string;
}

/**
 * Renders a `TanstackTable` instance over the project's own `Table`
 * primitives — sorting, filtering, pagination and selection state all live
 * on the table instance (`useDataTable`), this component only reads it.
 *
 * A click selects the row (Space too); a double click or Enter opens it
 * (`onRowOpen`). Edit and Delete live in the page header and act on the
 * selection — there is no menu on each row (decided 2026-11-10,
 * docs/design/patterns/listing_pages.md).
 */
export function DataTable<TData>({
  table,
  testIdPrefix,
  emptyState,
  enableSelection = true,
  onRowOpen,
  getRowLabel,
}: DataTableProps<TData>) {
  const t = useT();
  const rows = table.getRowModel().rows;
  // Hidden columns don't render a cell, so a `colSpan` that still counted
  // them made the empty-state placeholder wider than the visible table
  // (harmless visually — a `<td>` just spans more than the row has — but
  // wrong, and it drifted further from reality every column a routine hid).
  const columnCount = table.getVisibleLeafColumns().length + (enableSelection ? 1 : 0);
  const isAllSelected = table.getIsAllPageRowsSelected();
  const isSomeSelected = table.getIsSomePageRowsSelected();
  // "No rows" means two different things: nothing was ever registered, or the
  // search/filters in force match nothing. Telling someone with 27 people on file
  // that "the registry is empty" — and offering to add the first — is wrong.
  const { columnFilters, globalFilter } = table.getState();
  const isFiltered = columnFilters.length > 0 || String(globalFilter ?? '').trim() !== '';

  function handleClearFilters() {
    table.resetColumnFilters();
    table.setGlobalFilter('');
  }

  return (
    <div className="overflow-x-auto" data-testid={`${testIdPrefix}-table-container`}>
      <Table stacked data-testid={`${testIdPrefix}-table`}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {enableSelection ? (
                <TableHead className="w-10">
                  <Checkbox
                    aria-label={t('table.selectAll')}
                    data-testid={`${testIdPrefix}-checkbox-select-all`}
                    checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
                    onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked === true)}
                  />
                </TableHead>
              ) : null}
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  aria-sort={
                    header.column.getIsSorted() === 'asc'
                      ? 'ascending'
                      : header.column.getIsSorted() === 'desc'
                        ? 'descending'
                        : header.column.getCanSort()
                          ? 'none'
                          : undefined
                  }
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody data-testid={`${testIdPrefix}-tbody`}>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columnCount}>
                {isFiltered ? (
                  <EmptyState
                    title={t('table.noResults.title')}
                    description={t('table.noResults.body')}
                    action={
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleClearFilters}
                        data-testid={`${testIdPrefix}-no-results-button-clear`}
                      >
                        {t('table.noResults.clear')}
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState {...emptyState} />
                )}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const rowLabel = getRowLabel?.(row.original) ?? row.id;

              return (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  aria-selected={enableSelection ? row.getIsSelected() : undefined}
                  tabIndex={enableSelection ? 0 : undefined}
                  onClick={enableSelection ? () => row.toggleSelected() : undefined}
                  onDoubleClick={onRowOpen ? () => onRowOpen(row.original) : undefined}
                  // Guarded by `target !== currentTarget`: the checkbox is a
                  // focusable descendant with its own Space handling — without
                  // the guard, Space on it would toggle selection twice.
                  onKeyDown={
                    enableSelection
                      ? (event) => {
                          if (event.target !== event.currentTarget) {
                            return;
                          }

                          if (event.key === 'Enter' && onRowOpen) {
                            event.preventDefault();
                            onRowOpen(row.original);
                            return;
                          }

                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            row.toggleSelected();
                          }
                        }
                      : undefined
                  }
                  className={
                    enableSelection
                      ? 'cursor-pointer focus-visible:-outline-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40'
                      : undefined
                  }
                >
                  {enableSelection ? (
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <Checkbox
                        aria-label={t('table.selectRow', { name: rowLabel })}
                        data-testid={`${testIdPrefix}-checkbox-row`}
                        checked={row.getIsSelected()}
                        onCheckedChange={(checked) => row.toggleSelected(checked === true)}
                      />
                    </TableCell>
                  ) : null}
                  {row.getVisibleCells().map((cell) => {
                    const labelKey = cell.column.columnDef.meta?.labelKey;

                    return (
                      <TableCell key={cell.id} {...(labelKey ? { 'data-label': t(labelKey) } : {})}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
