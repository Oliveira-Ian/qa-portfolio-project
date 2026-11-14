import { WORK_ORDER_PRIORITIES, WORK_ORDER_STATUSES } from '@oliveira/schemas';
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

export const WORK_ORDER_FILTERABLE_COLUMNS: FilterableColumn[] = [
  { id: 'title', filterType: 'text' },
  { id: 'customer', filterType: 'text' },
  { id: 'status', filterType: 'enum' },
  { id: 'priority', filterType: 'enum' },
  { id: 'assignee', filterType: 'text' },
  { id: 'type', filterType: 'text' },
  { id: 'branch', filterType: 'text' },
  { id: 'equipment', filterType: 'text' },
  { id: 'scheduledAt', filterType: 'date' },
  { id: 'dueAt', filterType: 'date' },
  { id: 'createdAt', filterType: 'date' },
];

export const WORK_ORDER_FILTER_FIELDS: FilterDrawerField[] = [
  {
    key: 'status',
    labelKey: 'fsm.workOrders.columns.status',
    filterType: 'enum',
    options: WORK_ORDER_STATUS_OPTIONS,
  },
  {
    key: 'priority',
    labelKey: 'fsm.workOrders.columns.priority',
    filterType: 'enum',
    options: WORK_ORDER_PRIORITY_OPTIONS,
  },
  { key: 'assignee', labelKey: 'fsm.workOrders.columns.assignee', filterType: 'text' },
  { key: 'type', labelKey: 'fsm.workOrders.columns.type', filterType: 'text' },
  { key: 'branch', labelKey: 'fsm.workOrders.columns.branch', filterType: 'text' },
  { key: 'scheduledAt', labelKey: 'fsm.workOrders.columns.scheduledAt', filterType: 'date' },
  { key: 'dueAt', labelKey: 'fsm.workOrders.columns.dueAt', filterType: 'date' },
];
