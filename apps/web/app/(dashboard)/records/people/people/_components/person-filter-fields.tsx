import type { FilterDrawerField } from '@/components/data-table/filter-drawer';
import type { FilterableColumn } from '@/lib/list-query';
import { PERSON_DOCUMENT_TYPE_OPTIONS, PERSON_TYPE_OPTIONS } from './person-columns';

/**
 * The curated subset of `personColumns` shown in the "Filters" side panel —
 * every filterable column also has its own quick `ColumnFilter` in the
 * header, this is just the ones worth surfacing all at once. One of each
 * `filterType` on purpose, so the drawer exercises every widget.
 */
export const PERSON_FILTER_FIELDS: FilterDrawerField[] = [
  { key: 'name', label: 'Name', filterType: 'text' },
  { key: 'types', label: 'Type', filterType: 'enum', options: PERSON_TYPE_OPTIONS },
  {
    key: 'documentType',
    label: 'Document type',
    filterType: 'enum',
    options: PERSON_DOCUMENT_TYPE_OPTIONS,
  },
  { key: 'active', label: 'Status', filterType: 'boolean' },
  { key: 'createdAt', label: 'Created', filterType: 'date' },
];

/**
 * Every filterable `personColumns` column, not just the curated subset
 * above — `page.tsx` (server) and `PersonList` (client) both need this to
 * parse the URL's `f_*` params into the right `ColumnFiltersState` shape,
 * since a filter set from a column's own quick `ColumnFilter` (e.g. `city`)
 * is just as much part of the URL as one set from the drawer.
 */
export const PERSON_FILTERABLE_COLUMNS: FilterableColumn[] = [
  { id: 'code', filterType: 'text' },
  { id: 'name', filterType: 'text' },
  { id: 'types', filterType: 'enum' },
  { id: 'document', filterType: 'text' },
  { id: 'documentType', filterType: 'enum' },
  { id: 'email', filterType: 'text' },
  { id: 'phone', filterType: 'text' },
  { id: 'city', filterType: 'text' },
  { id: 'state', filterType: 'text' },
  { id: 'active', filterType: 'boolean' },
  { id: 'createdAt', filterType: 'date' },
  { id: 'updatedAt', filterType: 'date' },
];
