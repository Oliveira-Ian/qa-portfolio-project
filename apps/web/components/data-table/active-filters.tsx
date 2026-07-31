'use client';

import type { Column, Table } from '@tanstack/react-table';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { FilterDrawerField } from './filter-drawer';
import type { DateRangeFilterValue, NumberRangeFilterValue } from './filter-fns';

interface ActiveFiltersProps<TData> {
  table: Table<TData>;
  /**
   * Reused from the routine's `FilterDrawer` fields for a friendly label —
   * `FilterDrawerField[]` is a curated subset of the filterable columns
   * (`docs/design/patterns/listing_pages.md`), so a filter set via a
   * column's own quick `ColumnFilter` on a column outside that subset
   * (e.g. `city`, not one of `PERSON_FILTER_FIELDS`) falls back to a
   * humanized column id instead of having no label at all.
   */
  fields?: FilterDrawerField[];
  testIdPrefix: string;
}

function humanizeColumnId(id: string): string {
  const spaced = id.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function formatFilterValue<TData>(column: Column<TData, unknown>, value: unknown): string {
  const filterType = column.columnDef.meta?.filterType;

  if (filterType === 'boolean') {
    return value === 'true' ? 'Yes' : 'No';
  }

  if (filterType === 'enum') {
    const options = column.columnDef.meta?.filterOptions ?? [];
    const selected = (value as string[] | undefined) ?? [];

    return selected
      .map((entry) => options.find((option) => option.value === entry)?.label ?? entry)
      .join(', ');
  }

  if (filterType === 'date') {
    const range = value as DateRangeFilterValue;

    if (range.from && range.to) {
      return `${range.from} – ${range.to}`;
    }

    return range.from ? `From ${range.from}` : `Until ${range.to}`;
  }

  if (filterType === 'number') {
    const range = value as NumberRangeFilterValue;

    if (range.min !== undefined && range.max !== undefined) {
      return `${range.min} – ${range.max}`;
    }

    return range.min !== undefined ? `≥ ${range.min}` : `≤ ${range.max}`;
  }

  return String(value);
}

/**
 * Every active column filter — quick per-column `ColumnFilter` popovers and
 * `FilterDrawer` fields both write into the same `columnFilters` state, so
 * this reads all of it — rendered as a removable chip, plus a "Clear all".
 * Fixes the trap where a filter set on a column outside the routine's
 * curated `FilterDrawer` fields (and then hidden via "Customize") had no
 * remaining UI path to remove it.
 */
export function ActiveFilters<TData>({ table, fields, testIdPrefix }: ActiveFiltersProps<TData>) {
  const columnFilters = table.getState().columnFilters;

  if (columnFilters.length === 0) {
    return null;
  }

  function labelFor(columnId: string): string {
    return fields?.find((field) => field.key === columnId)?.label ?? humanizeColumnId(columnId);
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid={`${testIdPrefix}-active-filters`}
    >
      {columnFilters.map((filter) => {
        const column = table.getColumn(filter.id);

        if (!column) {
          return null;
        }

        const label = labelFor(filter.id);

        return (
          <Badge
            key={filter.id}
            variant="outline"
            className="gap-1 border-primary/30 bg-primary-light py-1 pr-1 text-primary"
            data-testid={`${testIdPrefix}-active-filter-${filter.id}`}
          >
            <span className="font-medium">{label}:</span>
            {formatFilterValue(column, filter.value)}
            <button
              type="button"
              aria-label={`Remove ${label} filter`}
              className="ml-0.5 grid size-4 place-items-center rounded-full transition-colors hover:bg-primary/15 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
              data-testid={`${testIdPrefix}-active-filter-remove-${filter.id}`}
              onClick={() => column.setFilterValue(undefined)}
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </Badge>
        );
      })}

      <Button
        type="button"
        variant="ghost"
        size="xs"
        onClick={() => table.resetColumnFilters()}
        data-testid={`${testIdPrefix}-active-filters-clear-all`}
      >
        Clear all
      </Button>
    </div>
  );
}
