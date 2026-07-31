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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from './empty-state';
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
}: DataTableProps<TData>) {
  const rows = table.getRowModel().rows;
  const columnCount = table.getAllLeafColumns().length + (enableSelection ? 1 : 0);

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
                    checked={table.getIsAllPageRowsSelected()}
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
              const tableRow = (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  onClick={enableSelection ? () => row.toggleSelected() : undefined}
                  className={enableSelection ? 'cursor-pointer' : undefined}
                >
                  {enableSelection ? (
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <Checkbox
                        aria-label={`Select row ${row.id}`}
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
