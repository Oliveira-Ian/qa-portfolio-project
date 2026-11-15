'use client';

import Link from 'next/link';
import {
  AlarmClock,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Plus,
  UserX,
} from 'lucide-react';
import {
  WORK_ORDER_PRIORITIES,
  formatWorkOrderNumber,
  type FsmDashboardDto,
  type WorkOrderListItemDto,
  type WorkOrderStatus,
} from '@oliveira/schemas';
import { Avatar, PersonChip } from '@/components/fsm/person-chip';
import { FsmCard, IconTile } from '@/components/fsm/record-layout';
import { WORK_ORDER_STATUS_COLOR, WorkOrderStatusPill } from '@/components/fsm/status-pill';
import { PriorityBadge } from '@/components/fsm/work-order-badges';
import { Button } from '@/components/ui/button';
import {
  businessDay,
  formatLongDay,
  formatShortDate,
  formatSpan,
  formatTime,
  formatWeekdayDate,
} from '@/lib/fsm-format';
import { useLocale, useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import { cn } from '@/lib/utils';

interface OperationsOverviewProps {
  dashboard: FsmDashboardDto;
  now: string;
  canCreate: boolean;
}

const BACKLOG: WorkOrderStatus[] = ['OPEN', 'SCHEDULED', 'IN_PROGRESS', 'ON_HOLD'];
const DAY_START = 7 * 60;
const DAY_END = 19 * 60;

/** Minutes since midnight in the business time zone. */
function minutesOf(iso: string, locale: string): number {
  const [hours = '0', minutes = '0'] = formatTime(iso, locale).split(':');
  return Number(hours) * 60 + Number(minutes);
}

/**
 * The FSM's home with `dashboard:view` (board FSM-03): KPI tiles that open the
 * list already filtered, three small charts (completed per week, the next
 * seven days, the work mix), today's dispatch by technician, what needs
 * attention, the team's load and the open work by priority. A technician
 * sees the same for their own work orders. Status colours are the FSM's
 * categorical set, always with a legend or a label (dataviz rules).
 */
export function OperationsOverview({ dashboard, now, canCreate }: OperationsOverviewProps) {
  const t = useT();
  const locale = useLocale();
  const mine = dashboard.scope === 'mine';
  const list = mine ? ROUTES.fsm.myWorkOrders : ROUTES.fsm.workOrders.list;
  const backlog = BACKLOG.reduce((sum, status) => sum + dashboard.byStatus[status], 0);
  const oldest = dashboard.needsAttention.find((order) => order.isOverdue);

  return (
    <div className="flex flex-col gap-5" data-testid="fsm-dashboard">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 data-testid="fsm-home-title">
            {t(mine ? 'fsmUi.dashboard.titleMine' : 'fsmUi.dashboard.title')}
          </h1>
          <p className="m-0 text-[13.5px] text-text-3">
            {t(mine ? 'fsmUi.dashboard.subtitleMine' : 'fsmUi.dashboard.subtitle', {
              date: formatLongDay(now, locale),
            })}
          </p>
        </div>
        {canCreate ? (
          <Button variant="create" asChild data-testid="fsm-home-new-work-order">
            <Link href={ROUTES.fsm.workOrders.new}>
              <Plus aria-hidden="true" />
              {t('fsmUi.dashboard.newWorkOrder')}
            </Link>
          </Button>
        ) : null}
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          href={list}
          icon={ClipboardList}
          label={t('fsmUi.dashboard.backlog')}
          value={backlog}
          testId="fsm-stat-open"
          footer={
            <div className="flex flex-col gap-2">
              <span
                aria-hidden="true"
                className="flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-divider"
              >
                {BACKLOG.map((status) =>
                  dashboard.byStatus[status] > 0 ? (
                    <span
                      key={status}
                      style={{
                        flexGrow: dashboard.byStatus[status],
                        background: WORK_ORDER_STATUS_COLOR[status],
                      }}
                    />
                  ) : null,
                )}
              </span>
              <span className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-text-2">
                {BACKLOG.map((status) => (
                  <span key={status} className="inline-flex items-center gap-1.5">
                    <i
                      aria-hidden="true"
                      className="block size-2 rounded-sm"
                      style={{ background: WORK_ORDER_STATUS_COLOR[status] }}
                    />
                    {t(`fsm.workOrders.status.${status}`)}{' '}
                    <b className="font-semibold tabular-nums">{dashboard.byStatus[status]}</b>
                  </span>
                ))}
              </span>
            </div>
          }
        />
        <Kpi
          href={`${list}?f_view=overdue`}
          icon={AlarmClock}
          tone="critical"
          label={t('fsmUi.dashboard.overdue')}
          value={dashboard.overdue}
          testId="fsm-stat-overdue"
          hint={
            dashboard.overdue > 0 && oldest?.dueAt
              ? t('fsmUi.dashboard.overdueHint', {
                  urgent: dashboard.overdueUrgent,
                  late: formatSpan(new Date(now).getTime() - new Date(oldest.dueAt).getTime(), t),
                })
              : t('fsmUi.dashboard.overdueNone')
          }
          go={t('fsmUi.dashboard.review')}
        />
        {!mine ? (
          <Kpi
            href={`${list}?f_view=unassigned`}
            icon={UserX}
            label={t('fsmUi.dashboard.unassigned')}
            value={dashboard.unassigned}
            testId="fsm-stat-unassigned"
            go={t('fsmUi.dashboard.unassignedHint')}
          />
        ) : (
          <Kpi
            href={`${list}?f_view=today`}
            icon={CalendarClock}
            label={t('fsmUi.common.today')}
            value={dashboard.scheduledToday}
            testId="fsm-stat-today"
          />
        )}
        <Kpi
          href={`${list}?f_status=COMPLETED`}
          icon={CheckCircle2}
          label={t('fsmUi.dashboard.completed')}
          value={dashboard.completedLast30Days}
          testId="fsm-stat-completed"
          go={t('fsmUi.dashboard.completedHint')}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <FsmCard
          title={t('fsmUi.dashboard.perWeek')}
          description={t('fsmUi.dashboard.perWeekBody')}
        >
          <Columns
            color={WORK_ORDER_STATUS_COLOR.COMPLETED}
            data={dashboard.completedPerWeek.map((week) => ({
              key: week.weekStart,
              label: formatShortDate(`${week.weekStart}T12:00:00Z`, locale),
              title: t('fsmUi.dashboard.weekOf', {
                date: formatShortDate(`${week.weekStart}T12:00:00Z`, locale),
              }),
              value: week.count,
            }))}
          />
        </FsmCard>
        <FsmCard title={t('fsmUi.dashboard.ahead')} description={t('fsmUi.dashboard.aheadBody')}>
          <Columns
            color={WORK_ORDER_STATUS_COLOR.SCHEDULED}
            data={dashboard.scheduledNext7Days.map((day, index) => ({
              key: day.date,
              label:
                index === 0
                  ? t('fsmUi.common.today')
                  : formatWeekdayDate(`${day.date}T12:00:00Z`, locale).split(',')[0]!,
              title: formatWeekdayDate(`${day.date}T12:00:00Z`, locale),
              value: day.count,
            }))}
          />
        </FsmCard>
        <WorkMix dashboard={dashboard} />
      </div>

      <Dispatch dashboard={dashboard} now={now} />
      <NeedsAttention orders={dashboard.needsAttention} now={now} list={list} />

      <div className={cn('grid gap-5', !mine && 'xl:grid-cols-2')}>
        {!mine ? <TeamLoad dashboard={dashboard} /> : null}
        <ByPriority dashboard={dashboard} />
      </div>
    </div>
  );
}

function Kpi({
  href,
  icon,
  label,
  value,
  hint,
  go,
  footer,
  tone,
  testId,
}: {
  href: string;
  icon: typeof ClipboardList;
  label: string;
  value: number;
  hint?: string;
  go?: string;
  footer?: React.ReactNode;
  tone?: 'critical';
  testId: string;
}) {
  return (
    <Link
      href={href}
      data-testid={testId}
      className="flex min-w-0 flex-col gap-2.5 rounded-xl border border-border bg-surface px-5 py-4 text-inherit shadow-fsm-card transition-colors hover:border-border-button focus-visible:ring-focus"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-[13px] font-medium whitespace-nowrap text-text-2">
          <IconTile
            icon={icon}
            className={cn(tone === 'critical' && 'bg-fsm-critical-bg text-fsm-critical-fg')}
          />
          {label}
        </span>
        {go ? (
          <span className="inline-flex shrink-0 items-center gap-1 text-[12.5px] text-text-3">
            <span className="hidden whitespace-nowrap 2xl:inline">{go}</span>
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          'text-[30px] leading-9 font-semibold tracking-[-0.02em] tabular-nums',
          tone === 'critical' && value > 0 && 'text-fsm-overdue',
        )}
      >
        {value}
      </span>
      {hint ? <span className="text-[12.5px] text-text-3">{hint}</span> : null}
      {footer}
    </Link>
  );
}

/** Thin columns from a shared baseline, the value over each (a few bars — each one labelled). */
function Columns({
  data,
  color,
}: {
  data: { key: string; label: string; title: string; value: number }[];
  color: string;
}) {
  const max = Math.max(1, ...data.map((item) => item.value));

  return (
    <figure className="m-0">
      <div className="flex h-36 items-end gap-2 border-b border-border" aria-hidden="true">
        {data.map((item) => (
          <div
            key={item.key}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1"
            title={`${item.title}: ${item.value}`}
          >
            <span className="text-[12px] font-semibold text-text-2 tabular-nums">{item.value}</span>
            <span
              className="w-full max-w-9 rounded-t-[4px]"
              style={{
                height: `${Math.max(item.value === 0 ? 0 : 4, (item.value / max) * 100)}%`,
                background: color,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-2" aria-hidden="true">
        {data.map((item) => (
          <span key={item.key} className="flex-1 truncate text-center text-[11.5px] text-text-3">
            {item.label}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <tbody>
          {data.map((item) => (
            <tr key={item.key}>
              <th scope="row">{item.title}</th>
              <td>{item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function HBars({
  rows,
  color,
}: {
  rows: { key: string; label: React.ReactNode; value: number; part?: number }[];
  color: string;
}) {
  const max = Math.max(1, ...rows.map((row) => row.value));

  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {rows.map((row) => (
        <li
          key={row.key}
          className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)_2rem] items-center gap-3 text-[13px]"
        >
          <span className="min-w-0 truncate text-text-2">{row.label}</span>
          <span
            className="relative h-2.5 overflow-hidden rounded-full bg-divider"
            aria-hidden="true"
          >
            <span
              className="absolute inset-y-0 left-0 rounded-full opacity-45"
              style={{ width: `${(row.value / max) * 100}%`, background: color }}
            />
            {row.part ? (
              <span
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: `${(row.part / max) * 100}%`, background: color }}
              />
            ) : null}
          </span>
          <span className="text-right font-semibold tabular-nums">{row.value}</span>
        </li>
      ))}
    </ul>
  );
}

function WorkMix({ dashboard }: { dashboard: FsmDashboardDto }) {
  const t = useT();
  const total = dashboard.byType.reduce((sum, row) => sum + row.count, 0);
  const preventive = dashboard.byType
    .filter((row) => row.countsAsPreventive)
    .reduce((sum, row) => sum + row.count, 0);

  return (
    <FsmCard title={t('fsmUi.dashboard.mix')} description={t('fsmUi.dashboard.mixBody')}>
      <div className="flex flex-col gap-4">
        <HBars
          color="var(--olv-accent-600)"
          rows={dashboard.byType.slice(0, 5).map((row) => ({
            key: row.typeId,
            label: row.name,
            value: row.count,
            part: row.count,
          }))}
        />
        {total > 0 ? (
          <p className="m-0 text-[12.5px] text-text-3">
            {t('fsmUi.dashboard.preventiveShare', {
              percent: Math.round((preventive / total) * 100),
            })}
          </p>
        ) : null}
      </div>
    </FsmCard>
  );
}

function Dispatch({ dashboard, now }: { dashboard: FsmDashboardDto; now: string }) {
  const t = useT();
  const locale = useLocale();
  const today = businessDay(now);
  const people = [
    ...dashboard.teamLoad.map((row) => ({
      id: row.membershipId as string | null,
      name: row.name as string | null,
    })),
    ...(dashboard.dispatch.some((order) => !order.assignee) ? [{ id: null, name: null }] : []),
  ];
  const ordersOf = (id: string | null) =>
    dashboard.dispatch.filter((order) => (order.assignee?.membershipId ?? null) === id);
  const scheduled = dashboard.dispatch.filter((order) => order.status === 'SCHEDULED').length;
  const inProgress = dashboard.dispatch.filter((order) => order.status === 'IN_PROGRESS').length;
  const free = dashboard.teamLoad.filter((row) => ordersOf(row.membershipId).length === 0).length;
  const nowMinutes = minutesOf(now, locale);
  const position = (minutes: number) =>
    `${((Math.min(Math.max(minutes, DAY_START), DAY_END) - DAY_START) / (DAY_END - DAY_START)) * 100}%`;
  const hours = [7, 9, 11, 13, 15, 17, 19];

  return (
    <FsmCard
      title={t('fsmUi.dashboard.dispatch')}
      description={t('fsmUi.dashboard.dispatchBody', { date: formatLongDay(now, locale) })}
      action={
        <span className="flex flex-wrap gap-3 text-[12.5px] text-text-2">
          <span>{t('fsmUi.dashboard.dispatchScheduled', { count: scheduled })}</span>
          <span>{t('fsmUi.dashboard.dispatchInProgress', { count: inProgress })}</span>
          {dashboard.scope === 'all' ? (
            <span>{t('fsmUi.dashboard.dispatchFree', { count: free })}</span>
          ) : null}
        </span>
      }
      testId="fsm-dispatch"
    >
      {people.length === 0 ? (
        <p className="m-0 text-[13.5px] text-text-3">{t('fsmUi.dashboard.nothingToday')}</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[200px_minmax(0,1fr)] gap-4 pb-2">
              <span />
              <div className="relative h-4 text-[11.5px] text-text-3">
                {hours.map((hour) => (
                  <span
                    key={hour}
                    className={cn(
                      'absolute tabular-nums',
                      hour === 19 ? '-translate-x-full' : hour === 7 ? '' : '-translate-x-1/2',
                    )}
                    style={{ left: position(hour * 60) }}
                  >
                    {String(hour).padStart(2, '0')}:00
                  </span>
                ))}
              </div>
            </div>
            <ul className="m-0 flex list-none flex-col divide-y divide-divider border-t border-divider p-0">
              {people.map((person) => {
                const orders = ordersOf(person.id);
                return (
                  <li
                    key={person.id ?? 'none'}
                    className="grid min-h-14 grid-cols-[200px_minmax(0,1fr)] items-center gap-4 py-2"
                  >
                    <PersonChip
                      name={person.name}
                      id={person.id}
                      unassignedLabel={t('fsmUi.dashboard.unassignedRow')}
                      subline={
                        orders.length
                          ? t('fsmUi.dashboard.todayCount', { count: orders.length })
                          : t('fsmUi.dashboard.freeToday')
                      }
                    />
                    <div className="relative h-9 rounded-md bg-surface-2">
                      {hours.map((hour) => (
                        <span
                          key={hour}
                          aria-hidden="true"
                          className="absolute inset-y-0 w-px bg-divider"
                          style={{ left: position(hour * 60) }}
                        />
                      ))}
                      {nowMinutes > DAY_START && nowMinutes < DAY_END ? (
                        <span
                          aria-hidden="true"
                          className="absolute -inset-y-1 w-0.5 rounded bg-fsm-critical"
                          style={{ left: position(nowMinutes) }}
                        />
                      ) : null}
                      {orders.map((order) => {
                        const startsToday =
                          order.scheduledAt !== null && businessDay(order.scheduledAt) === today;
                        const start =
                          order.scheduledAt && startsToday
                            ? minutesOf(order.scheduledAt, locale)
                            : DAY_START;
                        const end = startsToday
                          ? start + (order.estimatedMinutes ?? 60)
                          : Math.max(nowMinutes, DAY_START + 60);
                        return (
                          <Link
                            key={order.id}
                            href={ROUTES.fsm.workOrders.view(order.id)}
                            title={`${formatWorkOrderNumber(order.number)} ${order.title}${!startsToday && order.startedAt ? ` · ${t('fsmUi.dashboard.inProgressSince', { date: formatShortDate(order.startedAt, locale) })}` : ''}`}
                            className="absolute inset-y-1 flex min-w-0 items-center gap-1.5 overflow-hidden rounded-[6px] px-2 text-[12px] font-semibold text-white focus-visible:ring-focus"
                            style={{
                              left: position(start),
                              width: `max(72px, calc(${position(end)} - ${position(start)}))`,
                              background: WORK_ORDER_STATUS_COLOR[order.status],
                            }}
                          >
                            <span className="truncate [text-shadow:0_1px_1px_rgba(0,0,0,.25)]">
                              {formatWorkOrderNumber(order.number)}{' '}
                              {order.equipment?.name ?? order.title}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-text-2">
              {(['SCHEDULED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'] as WorkOrderStatus[]).map(
                (status) => (
                  <span key={status} className="inline-flex items-center gap-1.5">
                    <i
                      aria-hidden="true"
                      className="block size-2.5 rounded-sm"
                      style={{ background: WORK_ORDER_STATUS_COLOR[status] }}
                    />
                    {t(`fsm.workOrders.status.${status}`)}
                  </span>
                ),
              )}
              <span className="inline-flex items-center gap-1.5">
                <i aria-hidden="true" className="block h-2.5 w-0.5 rounded bg-fsm-critical" />
                {t('fsmUi.dashboard.now')}
              </span>
            </div>
          </div>
        </div>
      )}
    </FsmCard>
  );
}

function NeedsAttention({
  orders,
  now,
  list,
}: {
  orders: WorkOrderListItemDto[];
  now: string;
  list: string;
}) {
  const t = useT();
  const cols = 'grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_130px_100px_minmax(0,1fr)_140px]';
  const why = (order: WorkOrderListItemDto) => {
    if (order.isOverdue && order.dueAt) {
      return (
        <span className="flex flex-col">
          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-fsm-overdue">
            <AlarmClock aria-hidden="true" className="size-3.5" />
            {t('fsmUi.common.lateBy', {
              time: formatSpan(new Date(now).getTime() - new Date(order.dueAt).getTime(), t),
            })}
          </span>
          <span className="text-[12px] text-text-3">
            {!order.assignee
              ? t('fsmUi.dashboard.whyNoTechnician')
              : order.status === 'ON_HOLD'
                ? t('fsmUi.dashboard.whyOnHold')
                : order.status === 'IN_PROGRESS'
                  ? t('fsmUi.dashboard.whyInProgress')
                  : t('fsmUi.dashboard.whyScheduled')}
          </span>
        </span>
      );
    }
    return (
      <span className="text-[12.5px] font-medium text-fsm-on-hold-fg">
        {t('fsmUi.dashboard.whyOnHold')}
      </span>
    );
  };

  return (
    <FsmCard
      title={t('fsmUi.dashboard.attention')}
      description={t('fsmUi.dashboard.attentionBody', { count: orders.length })}
      action={
        <Link
          href={`${list}?f_view=overdue`}
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent-600 hover:underline"
        >
          {t('fsmUi.dashboard.allOverdue')}
          <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      }
      padded={false}
      testId="fsm-needs-attention"
    >
      {orders.length === 0 ? (
        <p className="m-0 px-5 pb-5 text-[13.5px] text-text-3">
          {t('fsmUi.dashboard.attentionNone')}
        </p>
      ) : (
        <div className="overflow-x-auto border-t border-border">
          <div role="table" className="min-w-[900px]">
            <div
              role="row"
              className={cn(
                'grid min-h-10 items-center gap-4 bg-surface-2 px-5 text-[12px] font-semibold text-text-3',
                cols,
              )}
            >
              <span role="columnheader">{t('fsmUi.workOrderList.workOrder')}</span>
              <span role="columnheader">{t('fsm.workOrders.columns.customer')}</span>
              <span role="columnheader">{t('fsm.workOrders.columns.status')}</span>
              <span role="columnheader">{t('fsm.workOrders.columns.priority')}</span>
              <span role="columnheader">{t('fsm.workOrders.columns.assignee')}</span>
              <span role="columnheader">{t('fsmUi.dashboard.why')}</span>
            </div>
            {orders.map((order) => (
              <Link
                key={order.id}
                role="row"
                href={ROUTES.fsm.workOrders.view(order.id)}
                className={cn(
                  'grid min-h-[60px] items-center gap-4 border-t border-divider px-5 py-2 text-sm hover:bg-surface-hover focus-visible:ring-focus',
                  cols,
                )}
              >
                <span role="cell" className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate font-semibold">
                    <span className="mr-1.5 font-mono text-[12.5px] font-medium text-text-3">
                      {formatWorkOrderNumber(order.number)}
                    </span>
                    {order.title}
                  </span>
                  <span className="truncate text-[12.5px] text-text-3">
                    {[order.type.name, order.equipment?.name].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <span role="cell" className="flex min-w-0 flex-col">
                  <span className="truncate">{order.customer.name}</span>
                  <span className="truncate text-[12.5px] text-text-3">{order.city ?? '—'}</span>
                </span>
                <span role="cell">
                  <WorkOrderStatusPill status={order.status} />
                </span>
                <span role="cell">
                  <PriorityBadge priority={order.priority} />
                </span>
                <span role="cell" className="min-w-0">
                  <PersonChip
                    name={order.assignee?.name ?? null}
                    id={order.assignee?.membershipId ?? null}
                    unassignedLabel={t('fsmUi.common.unassigned')}
                  />
                </span>
                <span role="cell">{why(order)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </FsmCard>
  );
}

function TeamLoad({ dashboard }: { dashboard: FsmDashboardDto }) {
  const t = useT();

  return (
    <FsmCard title={t('fsmUi.dashboard.team')} description={t('fsmUi.dashboard.teamBody')}>
      {dashboard.teamLoad.length === 0 ? (
        <p className="m-0 text-[13.5px] text-text-3">{t('fsmUi.dashboard.teamNone')}</p>
      ) : (
        <HBars
          color="var(--fsm-status-scheduled)"
          rows={dashboard.teamLoad.map((row) => ({
            key: row.membershipId,
            label: (
              <span className="inline-flex items-center gap-2">
                <Avatar name={row.name} id={row.membershipId} className="!size-5 !text-[9px]" />
                {row.name}
              </span>
            ),
            value: row.open,
            part: row.today,
          }))}
        />
      )}
    </FsmCard>
  );
}

function ByPriority({ dashboard }: { dashboard: FsmDashboardDto }) {
  const t = useT();

  return (
    <FsmCard
      title={t('fsmUi.dashboard.byPriority')}
      description={t('fsmUi.dashboard.byPriorityBody')}
    >
      <HBars
        color="var(--fsm-signal-warning)"
        rows={[...WORK_ORDER_PRIORITIES].reverse().map((priority) => ({
          key: priority,
          label: <PriorityBadge priority={priority} />,
          value: dashboard.openByPriority[priority],
          part: dashboard.openByPriority[priority],
        }))}
      />
    </FsmCard>
  );
}
