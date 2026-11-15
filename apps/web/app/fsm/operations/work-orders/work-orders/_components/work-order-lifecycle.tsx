'use client';

import { CheckCircle2, CircleDashed, CirclePause, CirclePlay, XCircle } from 'lucide-react';
import type { WorkOrderDto } from '@oliveira/schemas';
import { formatShortDateTime } from '@/lib/fsm-format';
import { useLocale, useT } from '@/lib/i18n/provider';
import { cn } from '@/lib/utils';

type StepState = 'done' | 'current' | 'todo' | 'cancelled';

interface Step {
  key: string;
  title: string;
  detail: string;
  state: StepState;
  paused?: boolean;
}

/**
 * Where the work order is (board FSM-05): Opened → Scheduled → In progress →
 * Completed, with who and when from its history. On hold reads as a paused
 * "In progress"; a cancelled one ends with "Cancelled" where it stopped.
 */
export function WorkOrderLifecycle({ workOrder }: { workOrder: WorkOrderDto }) {
  const t = useT();
  const locale = useLocale();
  const { status } = workOrder;
  const scheduledEvent = workOrder.events.find(
    (event) => event.type === 'STATUS_CHANGED' && event.toStatus === 'SCHEDULED',
  );
  const holdEvent = workOrder.events.find(
    (event) => event.type === 'STATUS_CHANGED' && event.toStatus === 'ON_HOLD',
  );
  const order = ['OPEN', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'] as const;
  const reached = (index: number) => {
    if (status === 'COMPLETED') {
      return true;
    }
    if (status === 'CANCELLED') {
      return (
        index === 0 ||
        (index === 1 && scheduledEvent !== undefined) ||
        (index === 2 && workOrder.startedAt !== null)
      );
    }
    const at = status === 'ON_HOLD' ? 2 : order.indexOf(status);
    return index < at;
  };
  const isCurrent = (index: number) =>
    status !== 'COMPLETED' &&
    status !== 'CANCELLED' &&
    index === (status === 'ON_HOLD' ? 2 : order.indexOf(status));

  const state = (index: number): StepState =>
    reached(index) ? 'done' : isCurrent(index) ? 'current' : 'todo';

  const steps: Step[] = [
    {
      key: 'opened',
      title: t('fsmUi.workOrder.lifecycle.opened'),
      detail: `${formatShortDateTime(workOrder.createdAt, locale)} · ${workOrder.createdBy}`,
      state: state(0),
    },
    {
      key: 'scheduled',
      title: t('fsmUi.workOrder.lifecycle.scheduled'),
      detail: scheduledEvent
        ? `${formatShortDateTime(scheduledEvent.createdAt, locale)}${workOrder.assignee ? ` · ${workOrder.assignee.name}` : ''}`
        : t('fsmUi.workOrder.lifecycle.notYet'),
      state: state(1),
    },
    {
      key: 'in-progress',
      title: t('fsmUi.workOrder.lifecycle.inProgress'),
      detail:
        status === 'ON_HOLD' && holdEvent
          ? t('fsmUi.workOrder.lifecycle.onHoldSince', {
              date: formatShortDateTime(holdEvent.createdAt, locale),
            })
          : workOrder.startedAt
            ? t('fsmUi.workOrder.lifecycle.since', {
                date: formatShortDateTime(workOrder.startedAt, locale),
              })
            : t('fsmUi.workOrder.lifecycle.notYet'),
      state: state(2),
      paused: status === 'ON_HOLD',
    },
    status === 'CANCELLED'
      ? {
          key: 'cancelled',
          title: t('fsmUi.workOrder.lifecycle.cancelled'),
          detail: formatShortDateTime(workOrder.cancelledAt, locale),
          state: 'cancelled',
        }
      : {
          key: 'completed',
          title: t('fsmUi.workOrder.lifecycle.completed'),
          detail: workOrder.completedAt
            ? formatShortDateTime(workOrder.completedAt, locale)
            : status === 'IN_PROGRESS'
              ? t('fsmUi.workOrder.lifecycle.needsResolution')
              : t('fsmUi.workOrder.lifecycle.notYet'),
          state: state(3),
        },
  ];

  return (
    <ol
      aria-label={t('fsmUi.workOrder.lifecycle.label')}
      data-testid="work-order-lifecycle"
      className="grid grid-cols-4 border-t border-border px-[22px] pt-4 pb-[18px]"
    >
      {steps.map((step) => {
        const Icon =
          step.state === 'done'
            ? CheckCircle2
            : step.state === 'cancelled'
              ? XCircle
              : step.state === 'current'
                ? step.paused
                  ? CirclePause
                  : CirclePlay
                : CircleDashed;

        return (
          <li
            key={step.key}
            aria-current={step.state === 'current' ? 'step' : undefined}
            className="flex min-w-0 flex-col gap-1.5 pr-3"
          >
            <span
              aria-hidden="true"
              className={cn(
                'h-1 rounded-full bg-border',
                step.state === 'done' && 'bg-fsm-completed',
                step.state === 'cancelled' && 'bg-fsm-cancelled',
                step.state === 'current' &&
                  (step.paused
                    ? 'bg-[linear-gradient(90deg,var(--fsm-status-on-hold)_55%,var(--olv-border)_55%)]'
                    : 'bg-[linear-gradient(90deg,var(--olv-accent-600)_55%,var(--olv-border)_55%)]'),
              )}
            />
            <span
              className={cn(
                'flex items-center gap-1.5 text-[13px] font-semibold text-foreground',
                step.state === 'todo' && 'font-medium text-text-muted',
              )}
            >
              <Icon
                aria-hidden="true"
                className={cn(
                  'size-3.5 shrink-0',
                  step.state === 'done' && 'text-fsm-completed',
                  step.state === 'current' &&
                    (step.paused ? 'text-fsm-on-hold' : 'text-accent-600'),
                  step.state === 'cancelled' && 'text-text-3',
                  step.state === 'todo' && 'text-text-disabled',
                )}
              />
              {step.title}
            </span>
            <span className="truncate text-[12.5px] text-text-3">{step.detail}</span>
          </li>
        );
      })}
    </ol>
  );
}
