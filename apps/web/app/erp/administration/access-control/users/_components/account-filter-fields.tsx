import type { FilterDrawerField } from '@/components/data-table/filter-drawer';
import type { FilterableColumn } from '@/lib/list-query';
import { ACCOUNT_ROLE_FILTER_OPTIONS } from './account-columns';

/**
 * The curated subset of `account-columns.tsx` shown in the "Filters" side
 * panel — every filterable column also has its own quick `ColumnFilter` in
 * the header, this is just the ones worth surfacing all at once.
 */
export const ACCOUNT_FILTER_FIELDS: FilterDrawerField[] = [
  { key: 'personName', labelKey: 'erp.columns.person', filterType: 'text' },
  {
    key: 'role',
    labelKey: 'erp.columns.role',
    filterType: 'enum',
    options: ACCOUNT_ROLE_FILTER_OPTIONS,
  },
  { key: 'active', labelKey: 'erp.columns.status', filterType: 'boolean' },
  { key: 'createdAt', labelKey: 'erp.columns.created', filterType: 'date' },
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
