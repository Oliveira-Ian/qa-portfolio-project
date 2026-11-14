import type { FilterDrawerField } from '@/components/data-table/filter-drawer';
import type { FilterableColumn } from '@/lib/list-query';

/**
 * Not a client module: `page.tsx` parses the URL's `f_*` params with
 * `WORK_ORDER_TYPE_FILTERABLE_COLUMNS` on the server.
 */
export const WORK_ORDER_TYPE_FILTERABLE_COLUMNS: FilterableColumn[] = [
  { id: 'name', filterType: 'text' },
  { id: 'description', filterType: 'text' },
  { id: 'active', filterType: 'boolean' },
];

export const WORK_ORDER_TYPE_FILTER_FIELDS: FilterDrawerField[] = [
  { key: 'name', labelKey: 'fsm.columns.name', filterType: 'text' },
  { key: 'active', labelKey: 'fsm.columns.status', filterType: 'boolean' },
];
