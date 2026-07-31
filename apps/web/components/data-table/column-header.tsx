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
 * text.
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
        'inline-flex items-center gap-1 rounded-sm font-medium text-foreground hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none',
        className,
      )}
    >
      {label}
      {sorted === 'asc' ? (
        <ArrowUp aria-hidden="true" className="size-3.5" />
      ) : sorted === 'desc' ? (
        <ArrowDown aria-hidden="true" className="size-3.5" />
      ) : (
        <ChevronsUpDown aria-hidden="true" className="size-3.5 text-muted-foreground" />
      )}
    </button>
  );
}
