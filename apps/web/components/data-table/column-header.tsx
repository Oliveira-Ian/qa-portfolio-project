'use client';

import type { Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  label: string;
  testId?: string;
  className?: string;
}

/**
 * Clicking cycles the 3 sort states TanStack ships by default — ascending,
 * descending, none — via `column.getToggleSortingHandler()` rather than a
 * hand-rolled cycle, so the behaviour matches what every other sortable
 * table already does. Columns with `enableSorting: false` render as plain
 * text. The header is a ghost button (handoff § 4, Table); the `aria-sort` a
 * screen reader hears sits on its cell, in `DataTable`.
 */
export function ColumnHeader<TData, TValue>({
  column,
  label,
  testId,
  className,
}: ColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <span className={className}>{label}</span>;
  }

  const sorted = column.getIsSorted();

  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      data-testid={testId}
      className={cn(
        '-ml-2 inline-flex h-7 items-center gap-1.5 rounded-sm px-2 text-[13px] font-semibold text-foreground transition-colors hover:bg-foreground/5 focus-visible:ring-focus',
        className,
      )}
    >
      {label}
      {sorted === 'asc' ? (
        <ArrowUp aria-hidden="true" className="size-3.5 text-text-3" />
      ) : sorted === 'desc' ? (
        <ArrowDown aria-hidden="true" className="size-3.5 text-text-3" />
      ) : (
        <ChevronsUpDown aria-hidden="true" className="size-3.5 text-text-3" />
      )}
    </button>
  );
}
