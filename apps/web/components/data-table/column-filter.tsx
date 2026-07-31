'use client';

import type { Column } from '@tanstack/react-table';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { FilterField } from './filter-field';

interface ColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
  label: string;
  testIdPrefix: string;
}

/**
 * The quick per-column filter trigger `DataTable`'s header cell renders next
 * to `ColumnHeader` when the column declares a `meta.filterType`. Writes into
 * the same `column.setFilterValue` that `FilterDrawer` uses, so opening one
 * never contradicts the other.
 */
export function ColumnFilter<TData, TValue>({
  column,
  label,
  testIdPrefix,
}: ColumnFilterProps<TData, TValue>) {
  const filterType = column.columnDef.meta?.filterType;

  if (!filterType) {
    return null;
  }

  const isActive = column.getFilterValue() !== undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className={cn(isActive ? 'text-primary' : 'text-muted-foreground')}
          aria-label={`Filter ${label}`}
          data-testid={`${testIdPrefix}-column-filter-${column.id}`}
        >
          <Filter aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <FilterField
          filterType={filterType}
          label={label}
          value={column.getFilterValue()}
          onChange={(value) => column.setFilterValue(value)}
          options={column.columnDef.meta?.filterOptions}
          testId={`${testIdPrefix}-column-filter-${column.id}-input`}
        />
      </PopoverContent>
    </Popover>
  );
}
