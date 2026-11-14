'use client';

import type { ColumnDef } from '@tanstack/react-table';
import {
  WORK_ORDER_STATUSES,
  formatWorkOrderNumber,
  type GridColumnPreferenceDto,
  type WorkOrderListItemDto,
  type WorkOrderPriority,
  type WorkOrderStatus,
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
import { useListNavigation } from '@/components/data-table/use-list-navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDateMedium, formatDateTimeMedium } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import { cn } from '@/lib/utils';
import { saveWorkOrderGridAction } from '../_actions/work-order-actions';
import {
  OverdueBadge,
  PriorityBadge,
  WorkOrderStatusBadge,
} from '@/components/fsm/work-order-badges';
import {
  WORK_ORDER_FILTERABLE_COLUMNS,
  WORK_ORDER_FILTER_FIELDS,
  WORK_ORDER_PRIORITY_OPTIONS,
  WORK_ORDER_STATUS_OPTIONS,
} from './work-order-filters';

const PREFIX = 'work-order-list';
const header = (key: Parameters<typeof columnHeader>[0]) =>
  columnHeader<WorkOrderListItemDto>(key, PREFIX);

function DateTimeCell({ value, isOverdue = false }: { value: string | null; isOverdue?: boolean }) {
  const locale = useLocale();

  return (
    <span
      className={cn(
        'olv-data tabular whitespace-nowrap',
        isOverdue ? 'text-destructive' : 'text-text-2',
      )}
    >
      {formatDateTimeMedium(value, locale)}
    </span>
  );
}

const columns: ColumnDef<WorkOrderListItemDto>[] = [
  {
    accessorKey: 'number',
    header: header('fsm.workOrders.columns.number'),
    cell: ({ getValue }) => <MonoCell value={formatWorkOrderNumber(getValue<number>())} />,
    enableColumnFilter: false,
  },
  {
    accessorKey: 'title',
    header: header('fsm.workOrders.columns.title'),
    cell: ({ row }) => (
      <NameCell
        value={row.original.title}
        sub={[row.original.type.name, row.original.equipment?.name].filter(Boolean).join(' · ')}
      />
    ),
    ...filterableColumn<WorkOrderListItemDto>('text', undefined, 'fsm.workOrders.columns.title'),
  },
  {
    id: 'customer',
    accessorFn: (workOrder) => workOrder.customer.name,
    header: header('fsm.workOrders.columns.customer'),
    cell: ({ row }) => <NameCell value={row.original.customer.name} sub={row.original.city} />,
    ...filterableColumn<WorkOrderListItemDto>('text', undefined, 'fsm.workOrders.columns.customer'),
  },
  {
    accessorKey: 'status',
    header: header('fsm.workOrders.columns.status'),
    cell: ({ row }) => (
      <span className="flex flex-wrap gap-1">
        <WorkOrderStatusBadge status={row.original.status} />
        {row.original.isOverdue ? <OverdueBadge /> : null}
      </span>
    ),
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
    cell: ({ getValue }) => getValue<string | null>() ?? '—',
    enableSorting: false,
    ...filterableColumn<WorkOrderListItemDto>('text', undefined, 'fsm.workOrders.columns.assignee'),
  },
  {
    accessorKey: 'scheduledAt',
    header: header('fsm.workOrders.columns.scheduledAt'),
    cell: ({ getValue }) => <DateTimeCell value={getValue<string | null>()} />,
    ...filterableColumn<WorkOrderListItemDto>(
      'date',
      undefined,
      'fsm.workOrders.columns.scheduledAt',
    ),
  },
  {
    accessorKey: 'dueAt',
    header: header('fsm.workOrders.columns.dueAt'),
    cell: ({ row }) => (
      <DateTimeCell value={row.original.dueAt} isOverdue={row.original.isOverdue} />
    ),
    ...filterableColumn<WorkOrderListItemDto>('date', undefined, 'fsm.workOrders.columns.dueAt'),
  },
  {
    id: 'type',
    accessorFn: (workOrder) => workOrder.type.name,
    header: header('fsm.workOrders.columns.type'),
    enableSorting: false,
    ...filterableColumn<WorkOrderListItemDto>('text', undefined, 'fsm.workOrders.columns.type'),
  },
  {
    id: 'branch',
    accessorFn: (workOrder) => (workOrder.branch ? workOrder.branch.code : null),
    header: header('fsm.workOrders.columns.branch'),
    cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
    enableSorting: false,
    ...filterableColumn<WorkOrderListItemDto>('text', undefined, 'fsm.workOrders.columns.branch'),
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
    ...filterableColumn<WorkOrderListItemDto>('date', undefined, 'fsm.workOrders.columns.created'),
  },
];

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
  'number',
  'title',
  'customer',
  'status',
  'priority',
  'assignee',
  'scheduledAt',
  'dueAt',
]);

type StatusTab = 'all' | WorkOrderStatus | 'custom';

/** All, and one tab per status: a shortcut to the Status filter, written into the URL. */
function StatusTabs() {
  const t = useT();
  const { query, setQuery } = useListNavigation(WORK_ORDER_FILTERABLE_COLUMNS);
  const statuses = query.filters.find((filter) => filter.id === 'status')?.value as
    string[] | undefined;
  const active: StatusTab =
    !statuses || statuses.length === 0
      ? 'all'
      : statuses.length === 1 && (WORK_ORDER_STATUSES as readonly string[]).includes(statuses[0]!)
        ? (statuses[0] as WorkOrderStatus)
        : 'custom';

  function handleChange(tab: string) {
    const others = query.filters.filter((filter) => filter.id !== 'status');

    setQuery({
      filters: tab === 'all' ? others : [...others, { id: 'status', value: [tab] }],
      page: 1,
    });
  }

  return (
    <Tabs value={active} onValueChange={handleChange} className="mb-5 max-w-full overflow-x-auto">
      <TabsList aria-label={t('fsm.workOrders.list.tabs.label')} data-testid={`${PREFIX}-tabs`}>
        <TabsTrigger value="all" aria-controls={undefined} data-testid={`${PREFIX}-tab-all`}>
          {t('fsm.workOrders.list.tabs.all')}
        </TabsTrigger>
        {WORK_ORDER_STATUSES.map((status) => (
          <TabsTrigger
            key={status}
            value={status}
            aria-controls={undefined}
            data-testid={`${PREFIX}-tab-${status.toLowerCase()}`}
          >
            {t(`fsm.workOrders.list.tabs.${status}`)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

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
}

export function WorkOrderList({
  rows,
  total,
  mode,
  canCreate,
  canEdit,
  gridPreference,
}: WorkOrderListProps) {
  return (
    <EntityList
      rows={rows}
      total={total}
      columns={columns}
      filterableColumns={WORK_ORDER_FILTERABLE_COLUMNS}
      filterFields={WORK_ORDER_FILTER_FIELDS}
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
      beforeToolbar={<StatusTabs />}
    />
  );
}
