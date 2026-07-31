import type { FilterDrawerField } from '@/components/data-table/filter-drawer';

/**
 * The curated subset of `profileColumns` shown in the "Filters" side panel —
 * every filterable column also has its own quick `ColumnFilter` in the
 * header, this is just the ones worth surfacing all at once.
 */
export const PROFILE_FILTER_FIELDS: FilterDrawerField[] = [
  { key: 'name', label: 'Name', filterType: 'text' },
  { key: 'isDefault', label: 'Default', filterType: 'boolean' },
  { key: 'isSystem', label: 'System', filterType: 'boolean' },
];
