import type { ColumnDef, FilterFn } from '@tanstack/react-table';
import { FILTER_FN_BY_TYPE } from './filter-fns';
import type { FilterOption, FilterType } from './types';

/**
 * Spread into a column def to make it filterable: `{ accessorKey: 'active',
 * header: ..., ...filterableColumn('boolean') }`. The routine only ever
 * declares the type — `ColumnFilter`/`FilterDrawer` pick the right widget
 * from `meta.filterType`, and the matching predicate from `FILTER_FN_BY_TYPE`
 * comes along with it, so no routine hand-writes filter logic.
 *
 * `filterFn` is omitted (not set to `undefined`) for `text` — TanStack's own
 * default (`includesString`) is already the right behaviour, and its
 * `ColumnDef.filterFn` type doesn't accept an explicit `undefined` under
 * this project's `exactOptionalPropertyTypes`.
 */
export function filterableColumn<TData>(
  filterType: FilterType,
  filterOptions?: FilterOption[] | undefined,
): Partial<ColumnDef<TData, unknown>> {
  const filterFn = FILTER_FN_BY_TYPE[filterType] as FilterFn<TData> | undefined;

  return {
    ...(filterFn ? { filterFn } : {}),
    meta: { filterType, filterOptions },
  };
}
