'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  formatWorkOrderNumber,
  type GridColumnPreferenceDto,
  type WorkOrderListItemDto,
  type WorkOrderPriority,
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
import { PersonChip } from '@/components/fsm/person-chip';
import { formatDateMedium, formatDateTimeMedium } from '@/lib/format';
import { dueSignal, formatShortDateTime } from '@/lib/fsm-format';
import { useLocale, useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import { saveWorkOrderGridAction } from '../_actions/work-order-actions';
import { AlarmClock } from 'lucide-react';
import { PriorityBadge, WorkOrderStatusBadge } from '@/components/fsm/work-order-badges';
import { WorkOrderViews, type WorkOrderListCounts, type WorkOrderView } from './work-order-views';
import {
  WORK_ORDER_FILTERABLE_COLUMNS,
  WORK_ORDER_PRIORITY_OPTIONS,
  WORK_ORDER_STATUS_OPTIONS,
  workOrderFilterFields,
  type WorkOrderFilterChoices,
} from './work-order-filters';

const PREFIX = 'work-order-list';
const header = (key: Parameters<typeof columnHeader>[0]) =>
  columnHeader<WorkOrderListItemDto>(key, PREFIX);

function ScheduledCell({ value }: { value: string | null }) {
  const locale = useLocale();

  return (
    <span className="whitespace-nowrap text-[13px] text-text-2 tabular-nums">
      {value ? formatShortDateTime(value, locale) : '—'}
    </span>
  );
}

/** Due: the date, "Today 18:00", or the overdue signal in red — the only place "late" shows. */
function DueCell({ row, now }: { row: WorkOrderListItemDto; now: string }) {
  const t = useT();
  const locale = useLocale();
  const isFinished = row.status === 'COMPLETED' || row.status === 'CANCELLED';
  const signal = dueSignal(row.dueAt, now, isFinished, t, locale);

  if (!row.dueAt) {
    return <span className="text-text-muted">—</span>;
  }
  if (signal?.tone === 'critical') {
    return (
      <span
        data-testid="work-order-overdue"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold whitespace-nowrap text-fsm-overdue"
      >
        <AlarmClock aria-hidden="true" className="size-3.5" />
        {signal.text}
        <span className="sr-only">{t('fsm.workOrders.overdue')}</span>
      </span>
    );
  }

  return (
    <span className="flex flex-col">
      <span className="text-[13px] whitespace-nowrap text-text-2 tabular-nums">
        {formatShortDateTime(row.dueAt, locale)}
      </span>
      {signal && signal.tone === 'warning' ? (
        <span className="text-[12px] text-fsm-warning-fg">{signal.text}</span>
      ) : null}
    </span>
  );
}

/** `#1028` and the title on one line, the type and equipment under it (board FSM-04). */
function WorkOrderTitleCell({ row }: { row: WorkOrderListItemDto }) {
  return (
    <span className="flex max-w-[26rem] min-w-0 flex-col gap-0.5">
      <span className="truncate font-semibold text-foreground">
        <span className="mr-1.5 font-mono text-[12.5px] font-medium text-text-3">
          {formatWorkOrderNumber(row.number)}
        </span>
        {row.title}
      </span>
      <span className="truncate text-[12.5px] text-text-3">
        {[row.type.name, row.equipment?.name].filter(Boolean).join(' · ')}
      </span>
    </span>
  );
}

function AssigneeCell({ row }: { row: WorkOrderListItemDto }) {
  const t = useT();

  return (
    <PersonChip
      name={row.assignee?.name ?? null}
      id={row.assignee?.membershipId ?? null}
      unassignedLabel={t('fsmUi.common.unassigned')}
    />
  );
}

/** The columns — type, branch and technician filter by the company's own lists. */
function buildColumns(
  choices: WorkOrderFilterChoices,
  now: string,
): ColumnDef<WorkOrderListItemDto>[] {
  return [
    {
      accessorKey: 'number',
      header: header('fsm.workOrders.columns.number'),
      cell: ({ getValue }) => <MonoCell value={formatWorkOrderNumber(getValue<number>())} />,
      enableColumnFilter: false,
    },
    {
      accessorKey: 'title',
      header: header('fsmUi.workOrderList.workOrder'),
      cell: ({ row }) => <WorkOrderTitleCell row={row.original} />,
      ...filterableColumn<WorkOrderListItemDto>('text', undefined, 'fsm.workOrders.columns.title'),
    },
    {
      id: 'customer',
      accessorFn: (workOrder) => workOrder.customer.name,
      header: header('fsm.workOrders.columns.customer'),
      cell: ({ row }) => <NameCell value={row.original.customer.name} sub={row.original.city} />,
      ...filterableColumn<WorkOrderListItemDto>(
        'text',
        undefined,
        'fsm.workOrders.columns.customer',
      ),
    },
    {
      accessorKey: 'status',
      header: header('fsm.workOrders.columns.status'),
      cell: ({ row }) => <WorkOrderStatusBadge status={row.original.status} />,
      ...filterableColumn<WorkOrderListItemDto>(
        'enum',
        WORK_ORDER_STATUS_OPTIONS,
        'fsm.workOrders.columns.status',
      ),
    },
    {
      accessorKey: 'priority',
      header: header('fsm.workOrders.columns.priority'),
      cell: ({ getValue }) => <PriorityBadge priority={getValue<WorkOrderPriority>()} />,
      ...filterableColumn<WorkOrderListItemDto>(
        'enum',
        WORK_ORDER_PRIORITY_OPTIONS,
        'fsm.workOrders.columns.priority',
      ),
    },
    {
      id: 'assignee',
      accessorFn: (workOrder) => workOrder.assignee?.name ?? null,
      header: header('fsm.workOrders.columns.assignee'),
      cell: ({ row }) => <AssigneeCell row={row.original} />,
      enableSorting: false,
      ...filterableColumn<WorkOrderListItemDto>(
        'enum',
        choices.technicians,
        'fsm.workOrders.columns.assignee',
      ),
    },
    {
      accessorKey: 'scheduledAt',
      header: header('fsm.workOrders.columns.scheduledAt'),
      cell: ({ getValue }) => <ScheduledCell value={getValue<string | null>()} />,
      ...filterableColumn<WorkOrderListItemDto>(
        'date',
        undefined,
        'fsm.workOrders.columns.scheduledAt',
      ),
    },
    {
      accessorKey: 'dueAt',
      header: header('fsm.workOrders.columns.dueAt'),
      cell: ({ row }) => <DueCell row={row.original} now={now} />,
      ...filterableColumn<WorkOrderListItemDto>('date', undefined, 'fsm.workOrders.columns.dueAt'),
    },
    {
      id: 'type',
      accessorFn: (workOrder) => workOrder.type.name,
      header: header('fsm.workOrders.columns.type'),
      enableSorting: false,
      ...filterableColumn<WorkOrderListItemDto>(
        'enum',
        choices.types,
        'fsm.workOrders.columns.type',
      ),
    },
    {
      id: 'branch',
      accessorFn: (workOrder) => (workOrder.branch ? workOrder.branch.code : null),
      header: header('fsm.workOrders.columns.branch'),
      cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
      enableSorting: false,
      ...filterableColumn<WorkOrderListItemDto>(
        'enum',
        choices.branches,
        'fsm.workOrders.columns.branch',
      ),
    },
    {
      id: 'equipment',
      accessorFn: (workOrder) => workOrder.equipment?.name ?? null,
      header: header('fsm.workOrders.columns.equipment'),
      cell: ({ getValue }) => getValue<string | null>() ?? '—',
      enableSorting: false,
      ...filterableColumn<WorkOrderListItemDto>(
        'text',
        undefined,
        'fsm.workOrders.columns.equipment',
      ),
    },
    {
      accessorKey: 'createdAt',
      header: header('fsm.workOrders.columns.created'),
      cell: ({ getValue }) => <DateCell value={getValue<string>()} />,
      ...filterableColumn<WorkOrderListItemDto>(
        'date',
        undefined,
        'fsm.workOrders.columns.created',
      ),
    },
  ];
}

const exportColumns: ExportColumn<WorkOrderListItemDto>[] = [
  {
    key: 'number',
    labelKey: 'fsm.workOrders.columns.number',
    getValue: (row) => formatWorkOrderNumber(row.number),
  },
  { key: 'title', labelKey: 'fsm.workOrders.columns.title', getValue: (row) => row.title },
  {
    key: 'customer',
    labelKey: 'fsm.workOrders.columns.customer',
    getValue: (row) => row.customer.name,
  },
  {
    key: 'status',
    labelKey: 'fsm.workOrders.columns.status',
    getValue: (row, { t }) => t(`fsm.workOrders.status.${row.status}`),
  },
  {
    key: 'priority',
    labelKey: 'fsm.workOrders.columns.priority',
    getValue: (row, { t }) => t(`fsm.workOrders.priority.${row.priority}`),
  },
  {
    key: 'assignee',
    labelKey: 'fsm.workOrders.columns.assignee',
    getValue: (row) => row.assignee?.name ?? '',
  },
  {
    key: 'scheduledAt',
    labelKey: 'fsm.workOrders.columns.scheduledAt',
    getValue: (row, { locale }) =>
      row.scheduledAt ? formatDateTimeMedium(row.scheduledAt, locale) : '',
  },
  {
    key: 'dueAt',
    labelKey: 'fsm.workOrders.columns.dueAt',
    getValue: (row, { locale }) => (row.dueAt ? formatDateTimeMedium(row.dueAt, locale) : ''),
  },
  { key: 'type', labelKey: 'fsm.workOrders.columns.type', getValue: (row) => row.type.name },
  {
    key: 'branch',
    labelKey: 'fsm.workOrders.columns.branch',
    getValue: (row) => row.branch?.code ?? '',
  },
  {
    key: 'equipment',
    labelKey: 'fsm.workOrders.columns.equipment',
    getValue: (row) => row.equipment?.name ?? '',
  },
  {
    key: 'createdAt',
    labelKey: 'fsm.workOrders.columns.created',
    getValue: (row, { locale }) => formatDateMedium(row.createdAt, locale),
  },
];

const CUSTOMIZABLE = customizableColumns(exportColumns, [
  'title',
  'customer',
  'status',
  'priority',
  'assignee',
  'scheduledAt',
  'dueAt',
]);

/** A no-op: work orders are cancelled, never deleted, so the list has no Delete. */
async function noDelete() {
  return { success: false };
}

interface WorkOrderListProps {
  rows: WorkOrderListItemDto[];
  total: number;
  /** `mine`: the technician's own work orders — the same list, its own title. */
  mode: 'all' | 'mine';
  canCreate: boolean;
  canEdit: boolean;
  gridPreference: GridColumnPreferenceDto | null;
  filterChoices: WorkOrderFilterChoices;
  /** The views and status chips' counts (from the dashboard summary). */
  counts?: WorkOrderListCounts | undefined;
  /** Which views the segmented control offers — Mine only for a technician. */
  views: WorkOrderView[];
  /** The server's clock, for the Due column's relative text. */
  now: string;
}

export function WorkOrderList({
  rows,
  total,
  mode,
  canCreate,
  canEdit,
  gridPreference,
  filterChoices,
  counts,
  views,
  now,
}: WorkOrderListProps) {
  const columns = useMemo(() => buildColumns(filterChoices, now), [filterChoices, now]);
  const filterFields = useMemo(
    () => workOrderFilterFields(filterChoices, mode),
    [filterChoices, mode],
  );

  return (
    <EntityList
      rows={rows}
      total={total}
      columns={columns}
      filterableColumns={WORK_ORDER_FILTERABLE_COLUMNS}
      filterFields={filterFields}
      customizableColumns={CUSTOMIZABLE}
      exportColumns={exportColumns}
      gridPreference={gridPreference}
      saveGridPreferenceAction={saveWorkOrderGridAction}
      deleteAction={noDelete}
      messages={mode === 'mine' ? 'fsm.workOrders.mine' : 'fsm.workOrders.list'}
      testIdPrefix={PREFIX}
      exportFileName={mode === 'mine' ? 'my-work-orders' : 'work-orders'}
      routes={ROUTES.fsm.workOrders}
      can={{ create: canCreate, edit: canEdit, delete: false }}
      getRowLabel={(row) => `${formatWorkOrderNumber(row.number)} ${row.title}`}
      beforeToolbar={<WorkOrderViews counts={counts} views={views} />}
    />
  );
}
