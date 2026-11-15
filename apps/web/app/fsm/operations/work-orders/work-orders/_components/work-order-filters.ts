import {
  WORK_ORDER_PRIORITIES,
  WORK_ORDER_STATUSES,
  type WorkOrderFilterOptionsDto,
} from '@oliveira/schemas';
import type { FilterDrawerField } from '@/components/data-table/filter-drawer';
import type { FilterOption } from '@/components/data-table/types';
import type { FilterableColumn } from '@/lib/list-query';

/** Not a client module: `page.tsx` parses the URL's `f_*` params with these on the server. */
export const WORK_ORDER_STATUS_OPTIONS: FilterOption[] = WORK_ORDER_STATUSES.map((status) => ({
  labelKey: `fsm.workOrders.status.${status}`,
  value: status,
}));

export const WORK_ORDER_PRIORITY_OPTIONS: FilterOption[] = WORK_ORDER_PRIORITIES.map(
  (priority) => ({ labelKey: `fsm.workOrders.priority.${priority}`, value: priority }),
);

/** Type, branch and technician are filtered by id — several can be picked at once. */
export const WORK_ORDER_FILTERABLE_COLUMNS: FilterableColumn[] = [
  { id: 'title', filterType: 'text' },
  { id: 'customer', filterType: 'text' },
  { id: 'status', filterType: 'enum' },
  { id: 'priority', filterType: 'enum' },
  { id: 'assignee', filterType: 'enum' },
  { id: 'type', filterType: 'enum' },
  { id: 'branch', filterType: 'enum' },
  { id: 'equipment', filterType: 'text' },
  { id: 'scheduledAt', filterType: 'date' },
  { id: 'dueAt', filterType: 'date' },
  { id: 'createdAt', filterType: 'date' },
  // The list's views (unassigned, overdue, today, mine) — the segmented control above the table.
  { id: 'view', filterType: 'enum' },
];

/** The company's types, branches and technicians, as filter options. */
export interface WorkOrderFilterChoices {
  types: FilterOption[];
  branches: FilterOption[];
  technicians: FilterOption[];
}

export function toWorkOrderFilterChoices(dto: WorkOrderFilterOptionsDto): WorkOrderFilterChoices {
  return {
    types: dto.types.map((type) => ({ value: type.id, label: type.name })),
    branches: dto.branches.map((branch) => ({
      value: branch.id,
      label: `${branch.code} · ${branch.name}`,
    })),
    technicians: dto.technicians.map((technician) => ({
      value: technician.membershipId,
      label: technician.name,
    })),
  };
}

/**
 * The filter panel (the FSM's filter pattern): dates first, then every
 * field with a few known values as a multi-select. "My work orders" has no
 * Technician — it is always the one looking.
 */
export function workOrderFilterFields(
  choices: WorkOrderFilterChoices,
  mode: 'all' | 'mine',
): FilterDrawerField[] {
  const multi = { filterType: 'enum' } as const;

  return [
    { key: 'scheduledAt', labelKey: 'fsm.workOrders.columns.scheduledAt', filterType: 'date' },
    { key: 'dueAt', labelKey: 'fsm.workOrders.columns.dueAt', filterType: 'date' },
    {
      key: 'status',
      labelKey: 'fsm.workOrders.columns.status',
      options: WORK_ORDER_STATUS_OPTIONS,
      ...multi,
    },
    {
      key: 'priority',
      labelKey: 'fsm.workOrders.columns.priority',
      options: WORK_ORDER_PRIORITY_OPTIONS,
      ...multi,
    },
    { key: 'type', labelKey: 'fsm.workOrders.columns.type', options: choices.types, ...multi },
    {
      key: 'branch',
      labelKey: 'fsm.workOrders.columns.branch',
      options: choices.branches,
      ...multi,
    },
    ...(mode === 'all'
      ? [
          {
            key: 'assignee',
            labelKey: 'fsm.workOrders.columns.assignee',
            options: choices.technicians,
            ...multi,
          } satisfies FilterDrawerField,
        ]
      : []),
  ];
}
