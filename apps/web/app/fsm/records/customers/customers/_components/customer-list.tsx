'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { CustomerDto, GridColumnPreferenceDto } from '@oliveira/schemas';
import {
  ActiveBadge,
  DateCell,
  MonoCell,
  NameCell,
  columnHeader,
  customizableColumns,
} from '@/components/data-table/column-kit';
import { filterableColumn } from '@/components/data-table/column-helpers';
import { EntityList } from '@/components/data-table/entity-list';
import type { ExportColumn } from '@/components/data-table/export-modal';
import { formatDateMedium } from '@/lib/format';
import { ROUTES } from '@/lib/navigation/routes';
import { deleteCustomersAction, saveCustomerGridAction } from '../_actions/customer-actions';
import { CUSTOMER_FILTERABLE_COLUMNS, CUSTOMER_FILTER_FIELDS } from './customer-filters';

const PREFIX = 'customer-list';
const header = (key: Parameters<typeof columnHeader>[0]) => columnHeader<CustomerDto>(key, PREFIX);

const columns: ColumnDef<CustomerDto>[] = [
  {
    id: 'name',
    accessorFn: (customer) => customer.person.name,
    header: header('fsm.columns.name'),
    cell: ({ row }) => (
      <NameCell value={row.original.person.name} sub={row.original.person.tradeName} />
    ),
    ...filterableColumn<CustomerDto>('text', undefined, 'fsm.columns.name'),
  },
  {
    id: 'document',
    accessorFn: (customer) => customer.person.document,
    header: header('fsm.columns.document'),
    cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
    ...filterableColumn<CustomerDto>('text', undefined, 'fsm.columns.document'),
  },
  {
    id: 'phone',
    accessorFn: (customer) => customer.person.mobile ?? customer.person.phone,
    header: header('fsm.columns.phone'),
    cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
    ...filterableColumn<CustomerDto>('text', undefined, 'fsm.columns.phone'),
  },
  {
    id: 'email',
    accessorFn: (customer) => customer.person.email,
    header: header('fsm.columns.email'),
    cell: ({ getValue }) => getValue<string | null>() ?? '—',
    ...filterableColumn<CustomerDto>('text', undefined, 'fsm.columns.email'),
  },
  {
    id: 'city',
    accessorFn: (customer) => customer.person.city,
    header: header('fsm.columns.city'),
    cell: ({ getValue }) => getValue<string | null>() ?? '—',
    enableSorting: false,
    ...filterableColumn<CustomerDto>('text', undefined, 'fsm.columns.city'),
  },
  {
    id: 'state',
    accessorFn: (customer) => customer.person.state,
    header: header('fsm.columns.state'),
    cell: ({ getValue }) => getValue<string | null>() ?? '—',
    enableSorting: false,
    ...filterableColumn<CustomerDto>('text', undefined, 'fsm.columns.state'),
  },
  {
    accessorKey: 'equipmentCount',
    header: header('fsm.columns.equipmentCount'),
    cell: ({ getValue }) => <MonoCell value={String(getValue<number>())} />,
    enableSorting: false,
    enableColumnFilter: false,
  },
  {
    id: 'active',
    accessorFn: (customer) => customer.person.active,
    header: header('fsm.columns.status'),
    cell: ({ getValue }) => <ActiveBadge active={getValue<boolean>()} />,
    ...filterableColumn<CustomerDto>('boolean', undefined, 'fsm.columns.status'),
  },
  {
    accessorKey: 'createdAt',
    header: header('fsm.columns.created'),
    cell: ({ getValue }) => <DateCell value={getValue<string>()} />,
    ...filterableColumn<CustomerDto>('date', undefined, 'fsm.columns.created'),
  },
];

const exportColumns: ExportColumn<CustomerDto>[] = [
  { key: 'name', labelKey: 'fsm.columns.name', getValue: (row) => row.person.name },
  {
    key: 'document',
    labelKey: 'fsm.columns.document',
    getValue: (row) => row.person.document ?? '',
  },
  {
    key: 'phone',
    labelKey: 'fsm.columns.phone',
    getValue: (row) => row.person.mobile ?? row.person.phone ?? '',
  },
  { key: 'email', labelKey: 'fsm.columns.email', getValue: (row) => row.person.email ?? '' },
  { key: 'city', labelKey: 'fsm.columns.city', getValue: (row) => row.person.city ?? '' },
  { key: 'state', labelKey: 'fsm.columns.state', getValue: (row) => row.person.state ?? '' },
  {
    key: 'equipmentCount',
    labelKey: 'fsm.columns.equipmentCount',
    getValue: (row) => String(row.equipmentCount),
  },
  {
    key: 'active',
    labelKey: 'fsm.columns.status',
    getValue: (row, { t }) => t(row.person.active ? 'common.active' : 'common.inactive'),
  },
  {
    key: 'createdAt',
    labelKey: 'fsm.columns.created',
    getValue: (row, { locale }) => formatDateMedium(row.createdAt, locale),
  },
];

const CUSTOMIZABLE = customizableColumns(exportColumns, [
  'name',
  'document',
  'phone',
  'city',
  'state',
  'equipmentCount',
  'active',
]);

interface CustomerListProps {
  rows: CustomerDto[];
  total: number;
  can: { create: boolean; edit: boolean; delete: boolean };
  gridPreference: GridColumnPreferenceDto | null;
}

export function CustomerList({ rows, total, can, gridPreference }: CustomerListProps) {
  return (
    <EntityList
      rows={rows}
      total={total}
      columns={columns}
      filterableColumns={CUSTOMER_FILTERABLE_COLUMNS}
      filterFields={CUSTOMER_FILTER_FIELDS}
      customizableColumns={CUSTOMIZABLE}
      exportColumns={exportColumns}
      gridPreference={gridPreference}
      saveGridPreferenceAction={saveCustomerGridAction}
      deleteAction={deleteCustomersAction}
      messages="fsm.customers.list"
      testIdPrefix={PREFIX}
      exportFileName="customers"
      routes={ROUTES.fsm.customers}
      can={can}
      getRowLabel={(row) => row.person.name}
    />
  );
}
