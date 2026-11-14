'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { GridColumnPreferenceDto, WorkOrderTypeDto } from '@oliveira/schemas';
import {
  ActiveBadge,
  DateCell,
  NameCell,
  columnHeader,
  customizableColumns,
} from '@/components/data-table/column-kit';
import { filterableColumn } from '@/components/data-table/column-helpers';
import { EntityList } from '@/components/data-table/entity-list';
import type { ExportColumn } from '@/components/data-table/export-modal';
import { formatDateMedium } from '@/lib/format';
import { ROUTES } from '@/lib/navigation/routes';
import {
  deleteWorkOrderTypesAction,
  saveWorkOrderTypeGridAction,
} from '../_actions/work-order-type-actions';
import {
  WORK_ORDER_TYPE_FILTERABLE_COLUMNS,
  WORK_ORDER_TYPE_FILTER_FIELDS,
} from './work-order-type-filters';

const PREFIX = 'work-order-type-list';
const header = (key: Parameters<typeof columnHeader>[0]) =>
  columnHeader<WorkOrderTypeDto>(key, PREFIX);

const columns: ColumnDef<WorkOrderTypeDto>[] = [
  {
    accessorKey: 'name',
    header: header('fsm.columns.name'),
    cell: ({ getValue }) => <NameCell value={getValue<string>()} />,
    ...filterableColumn<WorkOrderTypeDto>('text', undefined, 'fsm.columns.name'),
  },
  {
    accessorKey: 'description',
    header: header('fsm.columns.description'),
    cell: ({ getValue }) => (
      <span className="block max-w-[28rem] truncate text-text-2">
        {getValue<string | null>() ?? '—'}
      </span>
    ),
    enableSorting: false,
    ...filterableColumn<WorkOrderTypeDto>('text', undefined, 'fsm.columns.description'),
  },
  {
    accessorKey: 'active',
    header: header('fsm.columns.status'),
    cell: ({ getValue }) => <ActiveBadge active={getValue<boolean>()} />,
    ...filterableColumn<WorkOrderTypeDto>('boolean', undefined, 'fsm.columns.status'),
  },
  {
    accessorKey: 'createdAt',
    header: header('fsm.columns.created'),
    cell: ({ getValue }) => <DateCell value={getValue<string>()} />,
    enableColumnFilter: false,
  },
];

const exportColumns: ExportColumn<WorkOrderTypeDto>[] = [
  { key: 'name', labelKey: 'fsm.columns.name', getValue: (row) => row.name },
  {
    key: 'description',
    labelKey: 'fsm.columns.description',
    getValue: (row) => row.description ?? '',
  },
  {
    key: 'active',
    labelKey: 'fsm.columns.status',
    getValue: (row, { t }) => t(row.active ? 'common.active' : 'common.inactive'),
  },
  {
    key: 'createdAt',
    labelKey: 'fsm.columns.created',
    getValue: (row, { locale }) => formatDateMedium(row.createdAt, locale),
  },
];

const CUSTOMIZABLE = customizableColumns(exportColumns, ['name', 'description', 'active']);

interface WorkOrderTypeListProps {
  rows: WorkOrderTypeDto[];
  total: number;
  canManage: boolean;
  gridPreference: GridColumnPreferenceDto | null;
}

/** The company's work order types — one permission, `work-order-type:manage`, covers every action. */
export function WorkOrderTypeList({
  rows,
  total,
  canManage,
  gridPreference,
}: WorkOrderTypeListProps) {
  return (
    <EntityList
      rows={rows}
      total={total}
      columns={columns}
      filterableColumns={WORK_ORDER_TYPE_FILTERABLE_COLUMNS}
      filterFields={WORK_ORDER_TYPE_FILTER_FIELDS}
      customizableColumns={CUSTOMIZABLE}
      exportColumns={exportColumns}
      gridPreference={gridPreference}
      saveGridPreferenceAction={saveWorkOrderTypeGridAction}
      deleteAction={deleteWorkOrderTypesAction}
      messages="fsm.workOrderTypes.list"
      testIdPrefix={PREFIX}
      exportFileName="work-order-types"
      routes={ROUTES.fsm.workOrderTypes}
      can={{ create: canManage, edit: canManage, delete: canManage }}
      getRowLabel={(row) => row.name}
    />
  );
}
