'use client';

import type { Column, Table } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';
import type { Translator } from '@/lib/i18n/translate';
import type { FilterDrawerField } from './filter-drawer';
import type { DateRangeFilterValue, NumberRangeFilterValue } from './filter-fns';

interface ActiveFiltersProps<TData> {
  table: Table<TData>;
  /**
   * Reused from the routine's `FilterDrawer` fields for a friendly label —
   * `FilterDrawerField[]` is a curated subset of the filterable columns
   * (`docs/design/patterns/listing_pages.md`), so a filter set via a
   * column's own quick `ColumnFilter` on a column outside that subset
   * (e.g. `city`, not one of `PERSON_FILTER_FIELDS`) falls back to the
   * column's own `meta.labelKey`, and past that to a humanized column id.
   */
  fields?: FilterDrawerField[];
  testIdPrefix: string;
}

function humanizeColumnId(id: string): string {
  const spaced = id.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function formatFilterValue<TData>(
  column: Column<TData, unknown>,
  value: unknown,
  t: Translator,
): string {
  const filterType = column.columnDef.meta?.filterType;

  if (filterType === 'boolean') {
    return value === 'true' ? t('table.filters.yes') : t('table.filters.no');
  }

  if (filterType === 'enum') {
    const options = column.columnDef.meta?.filterOptions ?? [];
    const selected = (value as string[] | undefined) ?? [];

    return selected
      .map((entry) => {
        const option = options.find((candidate) => candidate.value === entry);

        return option ? t(option.labelKey) : entry;
      })
      .join(', ');
  }

  if (filterType === 'date') {
    const range = value as DateRangeFilterValue;

    if (range.from && range.to) {
      return `${range.from} – ${range.to}`;
    }

    return range.from
      ? t('table.filters.fromDate', { value: range.from })
      : t('table.filters.untilDate', { value: range.to ?? '' });
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
 * this reads all of it — rendered as a removable tag beside the Filters button
 * (handoff § 4, Search), plus a "Clear all". Fixes the trap where a filter set
 * on a column outside the routine's curated `FilterDrawer` fields (and then
 * hidden via "Customize") had no remaining UI path to remove it.
 */
export function ActiveFilters<TData>({ table, fields, testIdPrefix }: ActiveFiltersProps<TData>) {
  const t = useT();
  const columnFilters = table.getState().columnFilters;

  if (columnFilters.length === 0) {
    return null;
  }

  function labelFor(column: Column<TData, unknown>): string {
    const field = fields?.find((candidate) => candidate.key === column.id);

    if (field) {
      return t(field.labelKey);
    }

    const labelKey = column.columnDef.meta?.labelKey;

    return labelKey ? t(labelKey) : humanizeColumnId(column.id);
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

        const label = labelFor(column);

        return (
          <Badge
            key={filter.id}
            variant="outline"
            removeLabel={t('table.filters.remove', { label })}
            onRemove={() => column.setFilterValue(undefined)}
            data-testid={`${testIdPrefix}-active-filter-${filter.id}`}
          >
            <span className="font-medium">{label}:</span>
            {formatFilterValue(column, filter.value, t)}
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
        {t('table.filters.clearAll')}
      </Button>
    </div>
  );
}
