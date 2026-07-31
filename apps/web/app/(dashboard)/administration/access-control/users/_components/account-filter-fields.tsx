import type { FilterDrawerField } from '@/components/data-table/filter-drawer';

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
