import type { FilterDrawerField } from '@/components/data-table/filter-drawer';
import type { FilterOption } from '@/components/data-table/types';
import type { FilterableColumn, ListQueryState } from '@/lib/list-query';

/**
 * Not a client module: `page.tsx` parses the URL's `f_*` params with these on
 * the server. Name is the customers themselves, picked by id in a searchable
 * multi-select; City is one of the cities the customers are in.
 */
export const CUSTOMER_FILTERABLE_COLUMNS: FilterableColumn[] = [
  { id: 'name', filterType: 'enum' },
  { id: 'document', filterType: 'text' },
  { id: 'email', filterType: 'text' },
  { id: 'phone', filterType: 'text' },
  { id: 'city', filterType: 'enum' },
  { id: 'state', filterType: 'text' },
  { id: 'active', filterType: 'boolean' },
  { id: 'createdAt', filterType: 'date' },
];

/** What the filters offer: the customers already chosen (their names) and the cities. */
export interface CustomerFilterChoices {
  chosen: FilterOption[];
  cities: FilterOption[];
}

/** The customer ids the URL filters by (`f_name`). */
export function chosenCustomerIds(query: ListQueryState, columnId = 'name'): string[] {
  const value = query.filters.find((filter) => filter.id === columnId)?.value;

  return Array.isArray(value) ? (value as string[]) : [];
}

/** The filter panel: the date first, then the customers, their city and the status. */
export function customerFilterFields(
  choices: CustomerFilterChoices,
  searchCustomers: (search: string) => Promise<FilterOption[]>,
): FilterDrawerField[] {
  return [
    { key: 'createdAt', labelKey: 'fsm.columns.created', filterType: 'date' },
    {
      key: 'name',
      labelKey: 'fsm.columns.name',
      filterType: 'enum',
      options: choices.chosen,
      loadOptions: searchCustomers,
    },
    { key: 'city', labelKey: 'fsm.columns.city', filterType: 'enum', options: choices.cities },
    { key: 'active', labelKey: 'fsm.columns.status', filterType: 'boolean' },
  ];
}
