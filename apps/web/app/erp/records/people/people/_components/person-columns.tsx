'use client';

import type { ColumnDef, HeaderContext } from '@tanstack/react-table';
import type { Person } from '@oliveira/schemas';
import type { CustomizableColumn } from '@/components/data-table/grid-customization-modal';
import type { ExportColumn } from '@/components/data-table/export-modal';
import { ColumnFilter } from '@/components/data-table/column-filter';
import { ColumnHeader } from '@/components/data-table/column-header';
import { filterableColumn } from '@/components/data-table/column-helpers';
import type { FilterOption } from '@/components/data-table/types';
import { PersonStatusBadge, PersonTypeBadges } from '@/components/people/person-badges';
import { formatDateMedium } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n/provider';
import type { MessageKey } from '@/lib/i18n/translate';

export const PERSON_TYPE_OPTIONS: FilterOption[] = [
  { labelKey: 'erp.personType.client', value: 'CLIENT' },
  { labelKey: 'erp.personType.supplier', value: 'SUPPLIER' },
  { labelKey: 'erp.personType.user', value: 'USER' },
  { labelKey: 'erp.personType.employee', value: 'EMPLOYEE' },
];

/** CPF and CNPJ are the names of the documents themselves — never translated. */
export const PERSON_DOCUMENT_TYPE_OPTIONS: FilterOption[] = [
  { labelKey: 'erp.people.documentTypes.cpf', value: 'CPF' },
  { labelKey: 'erp.people.documentTypes.cnpj', value: 'CNPJ' },
];

/** Sort/filter trigger for a column header — every data column composes the same pair. */
function renderHeader(labelKey: MessageKey) {
  return function PersonColumnHeader({ column }: HeaderContext<Person, unknown>) {
    const t = useT();
    const label = t(labelKey);

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

/** A date in the interface language, mono — the design's number-and-date style. */
function DateCell({ value }: { value: string }) {
  const locale = useLocale();

  return <span className="olv-data tabular text-text-2">{formatDateMedium(value, locale)}</span>;
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
    header: renderHeader('erp.columns.code'),
    cell: ({ getValue }) => (
      <span className="olv-data tabular text-text-3" translate="no">
        {getValue<string>().slice(0, 8)}
      </span>
    ),
    ...filterableColumn<Person>('text', undefined, 'erp.columns.code'),
  },
  {
    accessorKey: 'name',
    header: renderHeader('erp.columns.name'),
    cell: ({ getValue }) => (
      <span className="block max-w-[18rem] truncate font-medium text-foreground">
        {getValue<string>()}
      </span>
    ),
    ...filterableColumn<Person>('text', undefined, 'erp.columns.name'),
  },
  {
    id: 'types',
    accessorFn: (person) => person.types,
    header: renderHeader('erp.columns.type'),
    cell: ({ getValue }) => <PersonTypeBadges types={getValue<Person['types']>()} />,
    enableSorting: false,
    ...filterableColumn<Person>('enum', PERSON_TYPE_OPTIONS, 'erp.columns.type'),
  },
  {
    accessorKey: 'document',
    header: renderHeader('erp.columns.document'),
    cell: ({ getValue }) => (
      <span className="olv-data tabular text-text-2" translate="no">
        {getValue<string | null>() ?? '—'}
      </span>
    ),
    ...filterableColumn<Person>('text', undefined, 'erp.columns.document'),
  },
  {
    accessorKey: 'documentType',
    header: renderHeader('erp.columns.documentType'),
    cell: ({ getValue }) => (
      <span className="olv-data" translate="no">
        {getValue<string | null>() ?? '—'}
      </span>
    ),
    ...filterableColumn<Person>('enum', PERSON_DOCUMENT_TYPE_OPTIONS, 'erp.columns.documentType'),
  },
  {
    accessorKey: 'email',
    header: renderHeader('erp.columns.email'),
    cell: ({ getValue }) => getValue<string | null>() ?? '—',
    ...filterableColumn<Person>('text', undefined, 'erp.columns.email'),
  },
  {
    accessorKey: 'phone',
    header: renderHeader('erp.columns.phone'),
    cell: ({ getValue }) => (
      <span className="olv-data tabular text-text-2">{getValue<string | null>() ?? '—'}</span>
    ),
    ...filterableColumn<Person>('text', undefined, 'erp.columns.phone'),
  },
  {
    accessorKey: 'city',
    header: renderHeader('erp.columns.city'),
    cell: ({ getValue }) => getValue<string | null>() ?? '—',
    ...filterableColumn<Person>('text', undefined, 'erp.columns.city'),
  },
  {
    accessorKey: 'state',
    header: renderHeader('erp.columns.state'),
    cell: ({ getValue }) => getValue<string | null>() ?? '—',
    ...filterableColumn<Person>('text', undefined, 'erp.columns.state'),
  },
  {
    accessorKey: 'active',
    header: renderHeader('erp.columns.status'),
    cell: ({ getValue }) => <PersonStatusBadge active={getValue<boolean>()} />,
    ...filterableColumn<Person>('boolean', undefined, 'erp.columns.status'),
  },
  {
    accessorKey: 'createdAt',
    header: renderHeader('erp.columns.created'),
    cell: ({ getValue }) => <DateCell value={getValue<string>()} />,
    ...filterableColumn<Person>('date', undefined, 'erp.columns.created'),
  },
  {
    accessorKey: 'updatedAt',
    header: renderHeader('erp.columns.updated'),
    cell: ({ getValue }) => <DateCell value={getValue<string>()} />,
    ...filterableColumn<Person>('date', undefined, 'erp.columns.updated'),
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
  { key: 'code', labelKey: 'erp.columns.code', getValue: (person) => person.id.slice(0, 8) },
  { key: 'name', labelKey: 'erp.columns.name', getValue: (person) => person.name },
  {
    key: 'types',
    labelKey: 'erp.columns.type',
    getValue: (person, { t }) =>
      person.types
        .map((type) => t(`erp.personType.${type.toLowerCase() as Lowercase<typeof type>}`))
        .join('; '),
  },
  {
    key: 'document',
    labelKey: 'erp.columns.document',
    getValue: (person) => person.document ?? '',
  },
  {
    key: 'documentType',
    labelKey: 'erp.columns.documentType',
    getValue: (person) => person.documentType ?? '',
  },
  { key: 'email', labelKey: 'erp.columns.email', getValue: (person) => person.email ?? '' },
  { key: 'phone', labelKey: 'erp.columns.phone', getValue: (person) => person.phone ?? '' },
  { key: 'city', labelKey: 'erp.columns.city', getValue: (person) => person.city ?? '' },
  { key: 'state', labelKey: 'erp.columns.state', getValue: (person) => person.state ?? '' },
  {
    key: 'active',
    labelKey: 'erp.columns.status',
    getValue: (person, { t }) => t(person.active ? 'erp.status.active' : 'erp.status.inactive'),
  },
  {
    key: 'createdAt',
    labelKey: 'erp.columns.created',
    getValue: (person, { locale }) => formatDateMedium(person.createdAt, locale),
  },
  {
    key: 'updatedAt',
    labelKey: 'erp.columns.updated',
    getValue: (person, { locale }) => formatDateMedium(person.updatedAt, locale),
  },
];

export const PERSON_CUSTOMIZABLE_COLUMNS: CustomizableColumn[] = PERSON_EXPORT_COLUMNS.map(
  ({ key, labelKey }) => ({
    key,
    labelKey,
    defaultVisible: PERSON_DEFAULT_VISIBLE_KEYS.has(key),
  }),
);
