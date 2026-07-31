import type { FilterDrawerField } from '@/components/data-table/filter-drawer';
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
