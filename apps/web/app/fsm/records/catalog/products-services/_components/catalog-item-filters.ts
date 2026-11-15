import type { FilterDrawerField } from '@/components/data-table/filter-drawer';
import type { FilterOption } from '@/components/data-table/types';
import type { FilterableColumn } from '@/lib/list-query';

/** Not a client module: `page.tsx` parses the URL's `f_*` params with these on the server. */
export const CATALOG_ITEM_KIND_OPTIONS: FilterOption[] = [
  { labelKey: 'fsm.catalogItems.kind.PRODUCT', value: 'PRODUCT' },
  { labelKey: 'fsm.catalogItems.kind.SERVICE', value: 'SERVICE' },
];

export const CATALOG_ITEM_FILTERABLE_COLUMNS: FilterableColumn[] = [
  { id: 'kind', filterType: 'enum' },
  { id: 'code', filterType: 'text' },
  { id: 'name', filterType: 'text' },
  { id: 'unit', filterType: 'text' },
  { id: 'active', filterType: 'boolean' },
  { id: 'createdAt', filterType: 'date' },
];

/** Dates first, then the rest (the filter panel's pattern). */
export const CATALOG_ITEM_FILTER_FIELDS: FilterDrawerField[] = [
  { key: 'createdAt', labelKey: 'fsm.columns.created', filterType: 'date' },
  { key: 'name', labelKey: 'fsm.columns.name', filterType: 'text' },
  {
    key: 'kind',
    labelKey: 'fsm.columns.kind',
    filterType: 'enum',
    options: CATALOG_ITEM_KIND_OPTIONS,
  },
  { key: 'active', labelKey: 'fsm.columns.status', filterType: 'boolean' },
];
