import type { FilterDrawerField } from '@/components/data-table/filter-drawer';
import type { FilterableColumn } from '@/lib/list-query';

/**
 * The curated subset of `account-columns.tsx` shown in the "Filters" side
 * panel — every filterable column also has its own quick `ColumnFilter` in
 * the header, this is just the ones worth surfacing all at once.
 */
export const ACCOUNT_FILTER_FIELDS: FilterDrawerField[] = [
  { key: 'personName', label: 'Person', filterType: 'text' },
  {
    key: 'role',
    label: 'Role',
    filterType: 'enum',
    options: [
      { label: 'Admin', value: 'ADMIN' },
      { label: 'User', value: 'USER' },
      { label: 'System', value: 'SYSTEM' },
    ],
  },
  { key: 'active', label: 'Status', filterType: 'boolean' },
  { key: 'createdAt', label: 'Created', filterType: 'date' },
];

/**
 * Every filterable `account-columns.tsx` column — `page.tsx` (server) and
 * `AccountList` (client) both need this to parse the URL's `f_*` params.
 * `profileCount` is included for the same reason `profileColumns`'s
 * `permissionCount` is (see `profile-filter-fields.tsx`) — it's handled as
 * a computed value server-side, but the URL encoding is identical.
 */
export const ACCOUNT_FILTERABLE_COLUMNS: FilterableColumn[] = [
  { id: 'personName', filterType: 'text' },
  { id: 'email', filterType: 'text' },
  { id: 'role', filterType: 'enum' },
  { id: 'active', filterType: 'boolean' },
  { id: 'profileCount', filterType: 'number' },
  { id: 'createdAt', filterType: 'date' },
];
