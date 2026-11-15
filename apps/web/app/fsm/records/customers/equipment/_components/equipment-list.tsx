'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  formatAddress,
  type EquipmentDto,
  type EquipmentStatus,
  type GridColumnPreferenceDto,
} from '@oliveira/schemas';
import {
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
import { searchCustomerFilterAction } from '../../customers/_actions/customer-actions';
import { deleteEquipmentAction, saveEquipmentGridAction } from '../_actions/equipment-actions';
import {
  EQUIPMENT_FILTERABLE_COLUMNS,
  EQUIPMENT_STATUS_OPTIONS,
  equipmentFilterFields,
  type EquipmentFilterChoices,
} from './equipment-filters';
import { EquipmentStatusBadge } from './equipment-status-badge';

const PREFIX = 'equipment-list';
const header = (key: Parameters<typeof columnHeader>[0]) => columnHeader<EquipmentDto>(key, PREFIX);

/** Customer and Category filter from lists: the customers (searched) and the categories in use. */
function buildColumns(choices: EquipmentFilterChoices): ColumnDef<EquipmentDto>[] {
  return [
    {
      accessorKey: 'tag',
      header: header('fsm.columns.tag'),
      cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
      ...filterableColumn<EquipmentDto>('text', undefined, 'fsm.columns.tag'),
    },
    {
      accessorKey: 'name',
      header: header('fsm.columns.name'),
      cell: ({ row }) => (
        <NameCell
          value={row.original.name}
          sub={[row.original.manufacturer, row.original.model].filter(Boolean).join(' ')}
        />
      ),
      ...filterableColumn<EquipmentDto>('text', undefined, 'fsm.columns.name'),
    },
    {
      id: 'customer',
      accessorFn: (equipment) => equipment.customer.name,
      header: header('fsm.columns.customer'),
      cell: ({ getValue }) => (
        <span className="block max-w-[16rem] truncate">{getValue<string>()}</span>
      ),
      ...filterableColumn<EquipmentDto>(
        'enum',
        choices.customers,
        'fsm.columns.customer',
        searchCustomerFilterAction,
      ),
    },
    {
      id: 'location',
      accessorFn: (equipment) =>
        [equipment.address?.label ?? equipment.address?.city, equipment.location]
          .filter(Boolean)
          .join(' · ') || null,
      header: header('fsm.columns.location'),
      cell: ({ getValue }) => (
        <span className="block max-w-[16rem] truncate text-text-2">
          {getValue<string | null>() ?? '—'}
        </span>
      ),
      enableSorting: false,
      enableColumnFilter: false,
    },
    {
      accessorKey: 'category',
      header: header('fsm.columns.category'),
      cell: ({ getValue }) => getValue<string | null>() ?? '—',
      ...filterableColumn<EquipmentDto>('enum', choices.categories, 'fsm.columns.category'),
    },
    {
      accessorKey: 'manufacturer',
      header: header('fsm.columns.manufacturer'),
      cell: ({ getValue }) => getValue<string | null>() ?? '—',
      ...filterableColumn<EquipmentDto>('text', undefined, 'fsm.columns.manufacturer'),
    },
    {
      accessorKey: 'serialNumber',
      header: header('fsm.columns.serialNumber'),
      cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
      enableSorting: false,
      ...filterableColumn<EquipmentDto>('text', undefined, 'fsm.columns.serialNumber'),
    },
    {
      accessorKey: 'warrantyUntil',
      header: header('fsm.columns.warrantyUntil'),
      cell: ({ getValue }) => <DateCell value={getValue<string | null>()} />,
      ...filterableColumn<EquipmentDto>('date', undefined, 'fsm.columns.warrantyUntil'),
    },
    {
      accessorKey: 'status',
      header: header('fsm.columns.status'),
      cell: ({ getValue }) => <EquipmentStatusBadge status={getValue<EquipmentStatus>()} />,
      ...filterableColumn<EquipmentDto>('enum', EQUIPMENT_STATUS_OPTIONS, 'fsm.columns.status'),
    },
  ];
}

const exportColumns: ExportColumn<EquipmentDto>[] = [
  { key: 'tag', labelKey: 'fsm.columns.tag', getValue: (row) => row.tag ?? '' },
  { key: 'name', labelKey: 'fsm.columns.name', getValue: (row) => row.name },
  { key: 'customer', labelKey: 'fsm.columns.customer', getValue: (row) => row.customer.name },
  {
    key: 'location',
    labelKey: 'fsm.columns.location',
    getValue: (row) =>
      [row.address ? formatAddress(row.address) : '', row.location ?? '']
        .filter(Boolean)
        .join(' · '),
  },
  { key: 'category', labelKey: 'fsm.columns.category', getValue: (row) => row.category ?? '' },
  {
    key: 'manufacturer',
    labelKey: 'fsm.columns.manufacturer',
    getValue: (row) => row.manufacturer ?? '',
  },
  { key: 'model', labelKey: 'fsm.columns.model', getValue: (row) => row.model ?? '' },
  {
    key: 'serialNumber',
    labelKey: 'fsm.columns.serialNumber',
    getValue: (row) => row.serialNumber ?? '',
  },
  {
    key: 'warrantyUntil',
    labelKey: 'fsm.columns.warrantyUntil',
    getValue: (row, { locale }) =>
      row.warrantyUntil ? formatDateMedium(row.warrantyUntil, locale) : '',
  },
  {
    key: 'status',
    labelKey: 'fsm.columns.status',
    getValue: (row, { t }) => t(`fsm.equipment.status.${row.status}`),
  },
];

const CUSTOMIZABLE = customizableColumns(exportColumns, [
  'tag',
  'name',
  'customer',
  'location',
  'category',
  'status',
]);

interface EquipmentListProps {
  rows: EquipmentDto[];
  total: number;
  can: { create: boolean; edit: boolean; delete: boolean };
  gridPreference: GridColumnPreferenceDto | null;
  filterChoices: EquipmentFilterChoices;
}

export function EquipmentList({
  rows,
  total,
  can,
  gridPreference,
  filterChoices,
}: EquipmentListProps) {
  const columns = useMemo(() => buildColumns(filterChoices), [filterChoices]);
  const filterFields = useMemo(
    () => equipmentFilterFields(filterChoices, searchCustomerFilterAction),
    [filterChoices],
  );

  return (
    <EntityList
      rows={rows}
      total={total}
      columns={columns}
      filterableColumns={EQUIPMENT_FILTERABLE_COLUMNS}
      filterFields={filterFields}
      customizableColumns={CUSTOMIZABLE}
      exportColumns={exportColumns}
      gridPreference={gridPreference}
      saveGridPreferenceAction={saveEquipmentGridAction}
      deleteAction={deleteEquipmentAction}
      messages="fsm.equipment.list"
      testIdPrefix={PREFIX}
      exportFileName="equipment"
      routes={ROUTES.fsm.equipment}
      can={can}
      getRowLabel={(row) => row.name}
    />
  );
}
