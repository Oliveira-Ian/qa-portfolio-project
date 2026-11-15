import type { FilterDrawerField } from '@/components/data-table/filter-drawer';
import type { FilterOption } from '@/components/data-table/types';
import type { FilterableColumn } from '@/lib/list-query';

/** Not a client module: `page.tsx` parses the URL's `f_*` params with these on the server. */
export const BRANCH_FILTERABLE_COLUMNS: FilterableColumn[] = [
  { id: 'code', filterType: 'text' },
  { id: 'name', filterType: 'text' },
  { id: 'document', filterType: 'text' },
  // One of the cities the branches are in, picked in a multi-select.
  { id: 'city', filterType: 'enum' },
  { id: 'state', filterType: 'text' },
  { id: 'phone', filterType: 'text' },
  { id: 'active', filterType: 'boolean' },
];

/** The filter panel: the name, the cities (a multi-select) and the status. */
export function branchFilterFields(cities: FilterOption[]): FilterDrawerField[] {
  return [
    { key: 'name', labelKey: 'fsm.columns.name', filterType: 'text' },
    { key: 'city', labelKey: 'fsm.columns.city', filterType: 'enum', options: cities },
    { key: 'active', labelKey: 'fsm.columns.status', filterType: 'boolean' },
  ];
}
