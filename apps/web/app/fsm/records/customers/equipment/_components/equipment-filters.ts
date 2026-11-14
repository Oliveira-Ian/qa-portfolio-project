import type { FilterDrawerField } from '@/components/data-table/filter-drawer';
import type { FilterOption } from '@/components/data-table/types';
import type { FilterableColumn } from '@/lib/list-query';

/** Not a client module: `page.tsx` parses the URL's `f_*` params with these on the server. */
export const EQUIPMENT_STATUS_OPTIONS: FilterOption[] = [
  { labelKey: 'fsm.equipment.status.ACTIVE', value: 'ACTIVE' },
  { labelKey: 'fsm.equipment.status.UNDER_MAINTENANCE', value: 'UNDER_MAINTENANCE' },
  { labelKey: 'fsm.equipment.status.INACTIVE', value: 'INACTIVE' },
];

export const EQUIPMENT_FILTERABLE_COLUMNS: FilterableColumn[] = [
  { id: 'name', filterType: 'text' },
  { id: 'tag', filterType: 'text' },
  { id: 'customer', filterType: 'text' },
  { id: 'category', filterType: 'text' },
  { id: 'manufacturer', filterType: 'text' },
  { id: 'model', filterType: 'text' },
  { id: 'serialNumber', filterType: 'text' },
  { id: 'status', filterType: 'enum' },
  { id: 'warrantyUntil', filterType: 'date' },
  { id: 'createdAt', filterType: 'date' },
];

export const EQUIPMENT_FILTER_FIELDS: FilterDrawerField[] = [
  { key: 'customer', labelKey: 'fsm.columns.customer', filterType: 'text' },
  { key: 'category', labelKey: 'fsm.columns.category', filterType: 'text' },
  {
    key: 'status',
    labelKey: 'fsm.columns.status',
    filterType: 'enum',
    options: EQUIPMENT_STATUS_OPTIONS,
  },
  { key: 'warrantyUntil', labelKey: 'fsm.columns.warrantyUntil', filterType: 'date' },
];
