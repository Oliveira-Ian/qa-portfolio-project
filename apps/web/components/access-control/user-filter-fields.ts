import type { FilterDrawerField } from '@/components/data-table/filter-drawer';
import type { FilterOption } from '@/components/data-table/types';
import type { FilterableColumn } from '@/lib/list-query';

/*
 * Plain data, deliberately outside the client module of the columns: the
 * list's page (a Server Component) parses the URL with it, and a value imported
 * from a 'use client' file reaches a Server Component as a reference, not data.
 */

/** The filter panel: the date first, then the name, the profiles (a multi-select) and the status. */
export function userFilterFields(profiles: FilterOption[]): FilterDrawerField[] {
  return [
    { key: 'createdAt', labelKey: 'accessControl.users.columns.created', filterType: 'date' },
    { key: 'personName', labelKey: 'accessControl.users.columns.name', filterType: 'text' },
    {
      key: 'profile',
      labelKey: 'accessControl.users.columns.profile',
      filterType: 'enum',
      options: profiles,
    },
    { key: 'active', labelKey: 'accessControl.users.columns.status', filterType: 'boolean' },
  ];
}

/** Every filterable column — the page (server) and the list (client) both parse the URL with it. */
export const USER_FILTERABLE_COLUMNS: FilterableColumn[] = [
  { id: 'personName', filterType: 'text' },
  { id: 'email', filterType: 'text' },
  // The product's profiles, by id, picked in a multi-select.
  { id: 'profile', filterType: 'enum' },
  { id: 'active', filterType: 'boolean' },
  { id: 'createdAt', filterType: 'date' },
];
