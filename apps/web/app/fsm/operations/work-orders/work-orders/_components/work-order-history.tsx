'use client';

import { useState } from 'react';
import {
  ArrowRight,
  ArrowRightLeft,
  ClipboardList,
  MessageSquare,
  Package,
  Pencil,
  UserCheck,
  type LucideIcon,
} from 'lucide-react';
import type { WorkOrderEventDto } from '@oliveira/schemas';
import { FsmCard } from '@/components/fsm/record-layout';
import { WorkOrderStatusPill } from '@/components/fsm/status-pill';
import { Avatar } from '@/components/fsm/person-chip';
import { businessDay, formatLongDay, formatTime } from '@/lib/fsm-format';
import { useLocale, useT } from '@/lib/i18n/provider';
import { cn } from '@/lib/utils';

type Kind = 'all' | 'status' | 'assignment' | 'items' | 'notes' | 'edits';

const KIND_OF: Record<WorkOrderEventDto['type'], Exclude<Kind, 'all'>> = {
  CREATED: 'status',
  STATUS_CHANGED: 'status',
  ASSIGNED: 'assignment',
  UNASSIGNED: 'assignment',
  ITEM_ADDED: 'items',
  ITEM_REMOVED: 'items',
  NOTE: 'notes',
  UPDATED: 'edits',
};

const ICON: Record<WorkOrderEventDto['type'], LucideIcon> = {
  CREATED: ClipboardList,
  UPDATED: Pencil,
  ASSIGNED: UserCheck,
  UNASSIGNED: UserCheck,
  STATUS_CHANGED: ArrowRightLeft,
  NOTE: MessageSquare,
  ITEM_ADDED: Package,
  ITEM_REMOVED: Package,
};

/**
 * The History tab (board FSM-05c): every change, grouped by day, newest
 * first, with chips to show one kind of event — status, assignment, items,
 * notes, edits.
 */
export function WorkOrderHistory({ events }: { events: WorkOrderEventDto[] }) {
  const t = useT();
  const locale = useLocale();
  const [kind, setKind] = useState<Kind>('all');
  const kinds: Kind[] = ['all', 'status', 'assignment', 'items', 'notes', 'edits'];
  const count = (value: Kind) =>
    value === 'all'
      ? events.length
      : events.filter((event) => KIND_OF[event.type] === value).length;
  const shown = kind === 'all' ? events : events.filter((event) => KIND_OF[event.type] === kind);
  const days = shown.reduce<{ day: string; at: string; items: WorkOrderEventDto[] }[]>(
    (groups, event) => {
      const day = businessDay(event.createdAt);
      const last = groups[groups.length - 1];
      if (last && last.day === day) {
        last.items.push(event);
      } else {
        groups.push({ day, at: event.createdAt, items: [event] });
      }
      return groups;
    },
    [],
  );

  const title = (event: WorkOrderEventDto): React.ReactNode => {
    if (event.type === 'STATUS_CHANGED' && event.toStatus) {
      return (
        <span className="inline-flex flex-wrap items-center gap-2">
          {t('fsmUi.workOrder.history.status')}
          {event.fromStatus ? <WorkOrderStatusPill status={event.fromStatus} /> : null}
          {event.fromStatus ? (
            <ArrowRight aria-hidden="true" className="size-3.5 text-text-muted" />
          ) : null}
          <WorkOrderStatusPill status={event.toStatus} />
        </span>
      );
    }
    if (event.type === 'ASSIGNED') {
      return t('fsm.workOrders.events.ASSIGNED', { name: event.message ?? '' });
    }
    return t(`fsm.workOrders.events.${event.type}`);
  };

  const detail = (event: WorkOrderEventDto): string | null => {
    if (event.type === 'ASSIGNED') {
      return null;
    }
    if (
      event.type === 'STATUS_CHANGED' &&
      !event.message &&
      (event.toStatus === 'SCHEDULED' || event.toStatus === 'OPEN')
    ) {
      return t('fsmUi.workOrder.history.automatic');
    }
    return event.message;
  };

  return (
    <FsmCard
      title={t('fsmUi.workOrder.history.title')}
      description={t('fsmUi.workOrder.history.body')}
      testId="work-order-history"
    >
      <div className="flex flex-col gap-5">
        <div
          role="group"
          aria-label={t('fsmUi.workOrder.history.filters')}
          className="flex flex-wrap gap-2"
        >
          {kinds.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={kind === value}
              onClick={() => setKind(value)}
              className={cn(
                'inline-flex h-8 items-center gap-2 rounded-full border border-border-button bg-surface px-3 text-[13px] font-medium text-text-2 transition-colors outline-none hover:bg-surface-hover focus-visible:ring-focus',
                kind === value && 'border-foreground bg-foreground text-white hover:bg-foreground',
              )}
            >
              {t(`fsmUi.workOrder.history.${value}`)}
              <span
                className={cn(
                  'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-foreground/[.06] px-1.5 text-[11px] font-semibold tabular-nums',
                  kind === value && 'bg-white/20 text-white',
                )}
              >
                {count(value)}
              </span>
            </button>
          ))}
        </div>

        {days.length === 0 ? (
          <p className="m-0 rounded-[10px] border border-dashed border-border-button px-4 py-5 text-center text-[13.5px] text-text-3">
            {t('fsmUi.workOrder.history.empty')}
          </p>
        ) : (
          days.map((group) => (
            <section key={group.day} className="flex flex-col gap-3">
              <h3 className="olv-overline m-0 text-text-3">{formatLongDay(group.at, locale)}</h3>
              <ol className="m-0 flex list-none flex-col p-0">
                {group.items.map((event, index) => {
                  const Icon = ICON[event.type];
                  const text = detail(event);
                  return (
                    <li
                      key={event.id}
                      className="relative grid grid-cols-[32px_minmax(0,1fr)_auto] gap-3 pb-4"
                    >
                      {index < group.items.length - 1 ? (
                        <span
                          aria-hidden="true"
                          className="absolute top-8 bottom-0 left-[15px] w-px bg-border"
                        />
                      ) : null}
                      <span className="flex size-8 items-center justify-center rounded-full border border-border bg-surface text-text-3">
                        <Icon aria-hidden="true" className="size-4" />
                      </span>
                      <div className="flex min-w-0 flex-col gap-1 pt-1">
                        <span className="text-sm font-semibold">{title(event)}</span>
                        {text ? (
                          <span className="text-[13px] whitespace-pre-line text-text-2">
                            {text}
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1.5 text-[12.5px] text-text-3">
                          <Avatar name={event.actorName} className="!size-5 !text-[9px]" />
                          {event.actorName}
                        </span>
                      </div>
                      <time
                        dateTime={event.createdAt}
                        className="pt-1.5 text-[12.5px] text-text-3 tabular-nums"
                      >
                        {formatTime(event.createdAt, locale)}
                      </time>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))
        )}
      </div>
    </FsmCard>
  );
}
