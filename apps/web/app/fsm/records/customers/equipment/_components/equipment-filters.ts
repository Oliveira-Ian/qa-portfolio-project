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
  // The customers (by id, searched) and the categories in use — picked in multi-selects.
  { id: 'customer', filterType: 'enum' },
  { id: 'category', filterType: 'enum' },
  { id: 'manufacturer', filterType: 'text' },
  { id: 'model', filterType: 'text' },
  { id: 'serialNumber', filterType: 'text' },
  { id: 'status', filterType: 'enum' },
  { id: 'warrantyUntil', filterType: 'date' },
  { id: 'createdAt', filterType: 'date' },
];

/** What the filters offer: the customers already chosen (their names) and the categories. */
export interface EquipmentFilterChoices {
  customers: FilterOption[];
  categories: FilterOption[];
}

/** The filter panel: the date first, then the status, the customers and the categories. */
export function equipmentFilterFields(
  choices: EquipmentFilterChoices,
  searchCustomers: (search: string) => Promise<FilterOption[]>,
): FilterDrawerField[] {
  return [
    { key: 'warrantyUntil', labelKey: 'fsm.columns.warrantyUntil', filterType: 'date' },
    {
      key: 'status',
      labelKey: 'fsm.columns.status',
      filterType: 'enum',
      options: EQUIPMENT_STATUS_OPTIONS,
    },
    {
      key: 'customer',
      labelKey: 'fsm.columns.customer',
      filterType: 'enum',
      options: choices.customers,
      loadOptions: searchCustomers,
    },
    {
      key: 'category',
      labelKey: 'fsm.columns.category',
      filterType: 'enum',
      options: choices.categories,
    },
  ];
}
