import type { FilterDrawerField } from '@/components/data-table/filter-drawer';
import type { FilterableColumn } from '@/lib/list-query';

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

/**
 * Every filterable `profileColumns` column — `page.tsx` (server) and
 * `ProfileList` (client) both need this to parse the URL's `f_*` params.
 * `permissionCount` is deliberately included even though the API handles it
 * specially (a computed value, filtered/sorted in memory rather than at the
 * database — see `profile.service.ts`) — the URL encoding is identical
 * either way, only the server-side handling differs.
 */
export const PROFILE_FILTERABLE_COLUMNS: FilterableColumn[] = [
  { id: 'name', filterType: 'text' },
  { id: 'description', filterType: 'text' },
  { id: 'permissionCount', filterType: 'number' },
  { id: 'isDefault', filterType: 'boolean' },
  { id: 'isSystem', filterType: 'boolean' },
];
