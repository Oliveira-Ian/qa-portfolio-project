import type { FilterDrawerField } from '@/components/data-table/filter-drawer';
import type { FilterableColumn } from '@/lib/list-query';

/** Not a client module: `page.tsx` parses the URL's `f_*` params with these on the server. */
export const BRANCH_FILTERABLE_COLUMNS: FilterableColumn[] = [
  { id: 'code', filterType: 'text' },
  { id: 'name', filterType: 'text' },
  { id: 'document', filterType: 'text' },
  { id: 'city', filterType: 'text' },
  { id: 'state', filterType: 'text' },
  { id: 'phone', filterType: 'text' },
  { id: 'active', filterType: 'boolean' },
];

export const BRANCH_FILTER_FIELDS: FilterDrawerField[] = [
  { key: 'name', labelKey: 'fsm.columns.name', filterType: 'text' },
  { key: 'city', labelKey: 'fsm.columns.city', filterType: 'text' },
  { key: 'active', labelKey: 'fsm.columns.status', filterType: 'boolean' },
];
