import type { FilterFn } from '@tanstack/react-table';
import type { FilterType } from './types';

export interface DateRangeFilterValue {
  from?: string | undefined;
  to?: string | undefined;
}

export interface NumberRangeFilterValue {
  min?: number | undefined;
  max?: number | undefined;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** `filterValue` is `'true' | 'false'` from the widget's Select — `undefined`/`''` means "any". */
const booleanFilterFn: FilterFn<unknown> = (row, columnId, filterValue: string) => {
  if (!filterValue) {
    return true;
  }

  return String(row.getValue(columnId)) === filterValue;
};

/** Matches a column holding either a single enum value or an array of them (e.g. `Person.types`). */
const enumFilterFn: FilterFn<unknown> = (row, columnId, filterValue: string[]) => {
  if (!filterValue || filterValue.length === 0) {
    return true;
  }

  const cellValue: unknown = row.getValue(columnId);

  if (Array.isArray(cellValue)) {
    return cellValue.some((value) => filterValue.includes(String(value)));
  }

  return filterValue.includes(String(cellValue));
};

/** `to` is inclusive of the whole day, matching how a date-only picker reads "up to and including". */
const dateRangeFilterFn: FilterFn<unknown> = (row, columnId, filterValue: DateRangeFilterValue) => {
  if (!filterValue || (!filterValue.from && !filterValue.to)) {
    return true;
  }

  const raw = row.getValue(columnId);

  if (typeof raw !== 'string') {
    return false;
  }

  const cellTime = new Date(raw).getTime();

  if (Number.isNaN(cellTime)) {
    return false;
  }

  if (filterValue.from && cellTime < new Date(filterValue.from).getTime()) {
    return false;
  }

  if (filterValue.to && cellTime > new Date(filterValue.to).getTime() + ONE_DAY_MS - 1) {
    return false;
  }

  return true;
};

const numberRangeFilterFn: FilterFn<unknown> = (
  row,
  columnId,
  filterValue: NumberRangeFilterValue,
) => {
  if (!filterValue || (filterValue.min === undefined && filterValue.max === undefined)) {
    return true;
  }

  const raw = Number(row.getValue(columnId));

  if (Number.isNaN(raw)) {
    return false;
  }

  if (filterValue.min !== undefined && raw < filterValue.min) {
    return false;
  }

  if (filterValue.max !== undefined && raw > filterValue.max) {
    return false;
  }

  return true;
};

/**
 * One filter function per declared `filterType` — `text` is absent on
 * purpose, it uses TanStack's own default (`includesString`, a
 * case-insensitive substring match), which is already the right behaviour.
 */
export const FILTER_FN_BY_TYPE: Partial<Record<FilterType, FilterFn<unknown>>> = {
  boolean: booleanFilterFn,
  enum: enumFilterFn,
  date: dateRangeFilterFn,
  number: numberRangeFilterFn,
};
