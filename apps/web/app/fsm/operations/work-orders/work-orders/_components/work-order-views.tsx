'use client';

import { WORK_ORDER_STATUSES, type WorkOrderStatus } from '@oliveira/schemas';
import { WORK_ORDER_STATUS_COLOR } from '@/components/fsm/status-pill';
import { useListNavigation } from '@/components/data-table/use-list-navigation';
import { useT } from '@/lib/i18n/provider';
import { cn } from '@/lib/utils';
import { WORK_ORDER_FILTERABLE_COLUMNS } from './work-order-filters';

export type WorkOrderView = 'unassigned' | 'overdue' | 'today' | 'mine';

export interface WorkOrderListCounts {
  all: number;
  views: Partial<Record<WorkOrderView, number>>;
  byStatus: Record<WorkOrderStatus, number>;
}

/**
 * The list's shortcuts (board FSM-04): a segmented control of views — All,
 * Unassigned, Overdue, Today, Mine — and combinable status chips with their
 * counts ("on" is ink-filled, so it reads as a filter, not a status). Both
 * write the URL's filters, so sorting and paging keep them.
 */
export function WorkOrderViews({
  counts,
  views,
}: {
  /** Absent when the numbers would not match the list (a manager on My work orders). */
  counts?: WorkOrderListCounts | undefined;
  views: WorkOrderView[];
}) {
  const t = useT();
  const { query, setQuery } = useListNavigation(WORK_ORDER_FILTERABLE_COLUMNS);
  const filterValue = (id: string) =>
    (query.filters.find((filter) => filter.id === id)?.value as string[] | undefined) ?? [];
  const view = filterValue('view')[0] ?? 'all';
  const statuses = filterValue('status');
  const others = (id: string) => query.filters.filter((filter) => filter.id !== id);

  function handleView(next: string) {
    setQuery({
      filters: next === 'all' ? others('view') : [...others('view'), { id: 'view', value: [next] }],
      page: 1,
    });
  }

  function handleStatus(status: WorkOrderStatus) {
    const next = statuses.includes(status)
      ? statuses.filter((value) => value !== status)
      : [...statuses, status];
    setQuery({
      filters:
        next.length === 0 ? others('status') : [...others('status'), { id: 'status', value: next }],
      page: 1,
    });
  }

  const segments: { key: string; count: number | undefined }[] = [
    { key: 'all', count: counts?.all },
    ...views.map((key) => ({ key, count: counts?.views[key] })),
  ];

  return (
    <div className="mb-4 flex flex-col gap-3" data-testid="work-order-list-views">
      <div
        role="group"
        aria-label={t('fsmUi.workOrderList.views.label')}
        className="inline-flex max-w-full gap-0.5 self-start overflow-x-auto rounded-[10px] bg-fsm-track p-[3px]"
      >
        {segments.map(({ key, count }) => (
          <button
            key={key}
            type="button"
            aria-pressed={view === key}
            onClick={() => handleView(key)}
            data-testid={`work-order-view-${key}`}
            className={cn(
              'inline-flex h-[30px] items-center gap-2 rounded-[7px] px-3 text-[13px] font-medium whitespace-nowrap text-text-3 transition-colors outline-none hover:bg-white/50 hover:text-foreground focus-visible:shadow-[0_0_0_2px_var(--olv-accent-600)]',
              view === key &&
                'bg-surface font-semibold text-foreground shadow-[0_1px_2px_rgba(16,24,40,.1),0_0_0_1px_rgba(16,24,40,.04)] hover:bg-surface',
            )}
          >
            {t(`fsmUi.workOrderList.views.${key}` as 'fsmUi.workOrderList.views.all')}
            {count !== undefined ? (
              <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-foreground/[.06] px-1.5 text-[11px] font-semibold tabular-nums">
                {count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div
        role="group"
        aria-label={t('fsmUi.workOrderList.statusFilters')}
        className="flex flex-wrap items-center gap-2"
      >
        {WORK_ORDER_STATUSES.map((status) => {
          const isOn = statuses.includes(status);
          return (
            <button
              key={status}
              type="button"
              aria-pressed={isOn}
              onClick={() => handleStatus(status)}
              data-testid={`work-order-list-tab-${status.toLowerCase()}`}
              className={cn(
                'inline-flex h-8 items-center gap-2 rounded-full border border-border-button bg-surface pr-2.5 pl-[9px] text-[13px] font-medium whitespace-nowrap text-text-2 transition-colors outline-none hover:bg-surface-hover focus-visible:ring-focus',
                isOn && 'border-foreground bg-foreground text-white hover:bg-foreground',
              )}
            >
              <i
                aria-hidden="true"
                className="block size-2 rounded-full"
                style={{ background: WORK_ORDER_STATUS_COLOR[status] }}
              />
              {t(`fsm.workOrders.status.${status}`)}
              {counts ? (
                <span
                  className={cn(
                    'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-divider px-1.5 text-[11px] font-semibold text-text-3 tabular-nums',
                    isOn && 'bg-white/20 text-white',
                  )}
                >
                  {counts.byStatus[status]}
                </span>
              ) : null}
            </button>
          );
        })}
        {statuses.length > 0 || view !== 'all' ? (
          <button
            type="button"
            onClick={() =>
              setQuery({
                filters: query.filters.filter(
                  (filter) => filter.id !== 'status' && filter.id !== 'view',
                ),
                page: 1,
              })
            }
            className="rounded px-1 text-[13px] font-semibold text-accent-600 hover:underline focus-visible:ring-focus"
          >
            {t('fsmUi.workOrderList.clear')}
          </button>
        ) : null}
      </div>
    </div>
  );
}
