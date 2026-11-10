import type { FilterDrawerField } from '@/components/data-table/filter-drawer';
import type { FilterableColumn } from '@/lib/list-query';

/*
 * Plain data, deliberately outside the client module of the columns: the
 * list's page (a Server Component) parses the URL with it, and a value imported
 * from a 'use client' file reaches a Server Component as a reference, not data.
 */

export const USER_FILTER_FIELDS: FilterDrawerField[] = [
  { key: 'personName', labelKey: 'accessControl.users.columns.name', filterType: 'text' },
  { key: 'profile', labelKey: 'accessControl.users.columns.profile', filterType: 'text' },
  { key: 'active', labelKey: 'accessControl.users.columns.status', filterType: 'boolean' },
  { key: 'createdAt', labelKey: 'accessControl.users.columns.created', filterType: 'date' },
];

/** Every filterable column — the page (server) and the list (client) both parse the URL with it. */
export const USER_FILTERABLE_COLUMNS: FilterableColumn[] = [
  { id: 'personName', filterType: 'text' },
  { id: 'email', filterType: 'text' },
  { id: 'profile', filterType: 'text' },
  { id: 'active', filterType: 'boolean' },
  { id: 'createdAt', filterType: 'date' },
];
