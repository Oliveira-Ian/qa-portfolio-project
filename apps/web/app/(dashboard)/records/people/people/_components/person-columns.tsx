'use client';

import type { ColumnDef, HeaderContext } from '@tanstack/react-table';
import type { Person } from '@oliveira/schemas';
import type { CustomizableColumn } from '@/components/data-table/grid-customization-modal';
import type { ExportColumn } from '@/components/data-table/export-modal';
import { ColumnFilter } from '@/components/data-table/column-filter';
import { ColumnHeader } from '@/components/data-table/column-header';
import { filterableColumn } from '@/components/data-table/column-helpers';
import { PersonStatusBadge, PersonTypeBadges } from '@/components/people/person-badges';
import { formatDate } from '@/lib/format';

export const PERSON_TYPE_OPTIONS = [
  { label: 'Client', value: 'CLIENT' },
  { label: 'Supplier', value: 'SUPPLIER' },
  { label: 'User', value: 'USER' },
  { label: 'Employee', value: 'EMPLOYEE' },
];

export const PERSON_DOCUMENT_TYPE_OPTIONS = [
  { label: 'CPF', value: 'CPF' },
  { label: 'CNPJ', value: 'CNPJ' },
];

/** Sort/filter trigger for a column header — every data column composes the same pair. */
function renderHeader(label: string) {
  return function PersonColumnHeader({ column }: HeaderContext<Person, unknown>) {
    return (
      <div className="flex items-center gap-1">
        <ColumnHeader
          column={column}
          label={label}
          testId={`person-list-column-header-${column.id}`}
        />
        <ColumnFilter column={column} label={label} testIdPrefix="person-list" />
      </div>
    );
  };
}

/**
 * The data columns for the People grid — the only Person-specific
 * piece of the listing. Structural concerns (selection, sorting, filtering,
 * pagination) all come from `components/data-table/`; this file only
 * declares which fields exist and how each renders and filters.
 */
export const personColumns: ColumnDef<Person>[] = [
  {
    id: 'code',
    accessorFn: (person) => person.id,
    header: renderHeader('Code'),
    cell: ({ getValue }) => (
      <span className="tabular text-xs text-text-muted" translate="no">
        {getValue<string>().slice(0, 8)}
      </span>
    ),
    ...filterableColumn<Person>('text'),
  },
  {
    accessorKey: 'name',
    header: renderHeader('Name'),
    cell: ({ getValue }) => (
      <span className="block max-w-[18rem] truncate font-medium text-foreground">
        {getValue<string>()}
      </span>
    ),
    ...filterableColumn<Person>('text'),
  },
  {
    id: 'types',
    accessorFn: (person) => person.types,
    header: renderHeader('Type'),
    cell: ({ getValue }) => <PersonTypeBadges types={getValue<Person['types']>()} />,
    enableSorting: false,
    ...filterableColumn<Person>('enum', PERSON_TYPE_OPTIONS),
  },
  {
    accessorKey: 'document',
    header: renderHeader('Document'),
    cell: ({ getValue }) => (
      <span className="tabular text-sm" translate="no">
        {getValue<string | null>() ?? '—'}
      </span>
    ),
    ...filterableColumn<Person>('text'),
  },
  {
    accessorKey: 'documentType',
    header: renderHeader('Document type'),
    cell: ({ getValue }) => getValue<string | null>() ?? '—',
    ...filterableColumn<Person>('enum', PERSON_DOCUMENT_TYPE_OPTIONS),
  },
  {
    accessorKey: 'email',
    header: renderHeader('Email'),
    cell: ({ getValue }) => getValue<string | null>() ?? '—',
    ...filterableColumn<Person>('text'),
  },
  {
    accessorKey: 'phone',
    header: renderHeader('Phone'),
    cell: ({ getValue }) => getValue<string | null>() ?? '—',
    ...filterableColumn<Person>('text'),
  },
  {
    accessorKey: 'city',
    header: renderHeader('City'),
    cell: ({ getValue }) => getValue<string | null>() ?? '—',
    ...filterableColumn<Person>('text'),
  },
  {
    accessorKey: 'state',
    header: renderHeader('State'),
    cell: ({ getValue }) => getValue<string | null>() ?? '—',
    ...filterableColumn<Person>('text'),
  },
  {
    accessorKey: 'active',
    header: renderHeader('Status'),
    cell: ({ getValue }) => <PersonStatusBadge active={getValue<boolean>()} />,
    ...filterableColumn<Person>('boolean'),
  },
  {
    accessorKey: 'createdAt',
    header: renderHeader('Created'),
    cell: ({ getValue }) => (
      <span className="tabular text-sm text-muted-foreground">
        {formatDate(getValue<string>())}
      </span>
    ),
    ...filterableColumn<Person>('date'),
  },
  {
    accessorKey: 'updatedAt',
    header: renderHeader('Updated'),
    cell: ({ getValue }) => (
      <span className="tabular text-sm text-muted-foreground">
        {formatDate(getValue<string>())}
      </span>
    ),
    ...filterableColumn<Person>('date'),
  },
];

/** What the original flat table showed — everything else is available via "Customize", hidden by default. */
export const PERSON_DEFAULT_VISIBLE_KEYS = new Set([
  'code',
  'name',
  'types',
  'document',
  'active',
  'createdAt',
]);

/** Shared by `GridCustomizationModal` (key/label) and `ExportModal` (key/label/getValue) — one declaration, not two. */
export const PERSON_EXPORT_COLUMNS: ExportColumn<Person>[] = [
  { key: 'code', label: 'Code', getValue: (person) => person.id.slice(0, 8) },
  { key: 'name', label: 'Name', getValue: (person) => person.name },
  { key: 'types', label: 'Type', getValue: (person) => person.types.join('; ') },
  { key: 'document', label: 'Document', getValue: (person) => person.document ?? '' },
  { key: 'documentType', label: 'Document type', getValue: (person) => person.documentType ?? '' },
  { key: 'email', label: 'Email', getValue: (person) => person.email ?? '' },
  { key: 'phone', label: 'Phone', getValue: (person) => person.phone ?? '' },
  { key: 'city', label: 'City', getValue: (person) => person.city ?? '' },
  { key: 'state', label: 'State', getValue: (person) => person.state ?? '' },
  { key: 'active', label: 'Status', getValue: (person) => (person.active ? 'Yes' : 'No') },
  { key: 'createdAt', label: 'Created', getValue: (person) => formatDate(person.createdAt) },
  { key: 'updatedAt', label: 'Updated', getValue: (person) => formatDate(person.updatedAt) },
];

export const PERSON_CUSTOMIZABLE_COLUMNS: CustomizableColumn[] = PERSON_EXPORT_COLUMNS.map(
  ({ key, label }) => ({ key, label, defaultVisible: PERSON_DEFAULT_VISIBLE_KEYS.has(key) }),
);
