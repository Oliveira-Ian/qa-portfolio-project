'use client';

import type { ReactNode } from 'react';
import { flexRender, type Table as TanstackTable } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { RowAction } from './row-actions-menu';

interface DataTableProps<TData> {
  table: TanstackTable<TData>;
  testIdPrefix: string;
  emptyState: { title: string; description: string; action?: ReactNode };
  /** Off for tables that don't select rows at all (none yet — every listing screen selects). */
  enableSelection?: boolean;
  /**
   * Wires the same actions a row's `RowActionsMenu` ("⋮" button, declared as
   * a regular column by the routine) exposes into a right-click menu on the
   * row itself — both paths land on the identical list, declared once.
   */
  rowActions?: (row: TData) => RowAction[];
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
 * Per `docs/especificacoes/levantamento_cadastro_pessoa.md`: "clicking a row
 * only selects the record" — there is no click/double-click navigation here
 * on purpose. Viewing/editing/deleting a row goes through `rowActions`, not
 * the row itself.
 */
export function DataTable<TData>({
  table,
  testIdPrefix,
  emptyState,
  enableSelection = true,
  rowActions,
  getRowLabel,
}: DataTableProps<TData>) {
  const rows = table.getRowModel().rows;
  // Hidden columns don't render a cell, so a `colSpan` that still counted
  // them made the empty-state placeholder wider than the visible table
  // (harmless visually — a `<td>` just spans more than the row has — but
  // wrong, and it drifted further from reality every column a routine hid).
  const columnCount = table.getVisibleLeafColumns().length + (enableSelection ? 1 : 0);
  const isAllSelected = table.getIsAllPageRowsSelected();
  const isSomeSelected = table.getIsSomePageRowsSelected();

  return (
    <div className="overflow-x-auto" data-testid={`${testIdPrefix}-table-container`}>
      <Table data-testid={`${testIdPrefix}-table`}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {enableSelection ? (
                <TableHead className="w-10">
                  <Checkbox
                    aria-label="Select all rows on this page"
                    data-testid={`${testIdPrefix}-checkbox-select-all`}
                    checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
                    onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked === true)}
                  />
                </TableHead>
              ) : null}
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
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
                <EmptyState {...emptyState} />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const rowLabel = getRowLabel?.(row.original) ?? row.id;

              const tableRow = (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  aria-selected={enableSelection ? row.getIsSelected() : undefined}
                  tabIndex={enableSelection ? 0 : undefined}
                  onClick={enableSelection ? () => row.toggleSelected() : undefined}
                  // Guarded by `target !== currentTarget`: the checkbox and
                  // the row-actions button are focusable descendants with
                  // their own Space/Enter handling (Radix's checkbox,
                  // the menu trigger button) — without the guard, pressing
                  // Space on either would toggle selection twice, once from
                  // its own handler and once from this bubbled event.
                  onKeyDown={
                    enableSelection
                      ? (event) => {
                          if (event.target !== event.currentTarget) {
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
                        aria-label={`Select ${rowLabel}`}
                        data-testid={`${testIdPrefix}-checkbox-row`}
                        checked={row.getIsSelected()}
                        onCheckedChange={(checked) => row.toggleSelected(checked === true)}
                      />
                    </TableCell>
                  ) : null}
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              );

              if (!rowActions) {
                return tableRow;
              }

              const actions = rowActions(row.original);

              return (
                <ContextMenu key={row.id}>
                  <ContextMenuTrigger asChild>{tableRow}</ContextMenuTrigger>
                  <ContextMenuContent>
                    {actions.map((action) => (
                      <ContextMenuItem
                        key={action.key}
                        disabled={action.disabled ?? false}
                        variant={action.variant ?? 'default'}
                        onSelect={action.onSelect}
                        data-testid={action.testId}
                      >
                        <action.icon aria-hidden="true" />
                        {action.label}
                      </ContextMenuItem>
                    ))}
                  </ContextMenuContent>
                </ContextMenu>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
