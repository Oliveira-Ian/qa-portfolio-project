'use client';

import { AlarmClock, AlertTriangle, ArrowDown, ArrowRight, ArrowUp } from 'lucide-react';
import type { WorkOrderPriority, WorkOrderStatus } from '@oliveira/schemas';
import { useT } from '@/lib/i18n/provider';
import { cn } from '@/lib/utils';
import { WorkOrderStatusPill } from './status-pill';

/*
 * The work order's marks (Oliveira FSM Design System V2, HANDOFF-FSM § 5.6):
 * the status is a pill, the priority an arrow and a word (never a pill), and
 * "overdue" a red alarm in the Due cell — never a second badge under the status.
 */
export function WorkOrderStatusBadge({ status }: { status: WorkOrderStatus }) {
  return <WorkOrderStatusPill status={status} />;
}

const PRIORITY_ICON = {
  LOW: ArrowDown,
  NORMAL: ArrowRight,
  HIGH: ArrowUp,
  URGENT: AlertTriangle,
} as const;

export function PriorityBadge({
  priority,
  className,
}: {
  priority: WorkOrderPriority;
  className?: string;
}) {
  const t = useT();
  const Icon = PRIORITY_ICON[priority];

  return (
    <span
      data-testid="work-order-priority"
      className={cn(
        'inline-flex items-center gap-1.5 text-[13px] whitespace-nowrap text-text-2',
        priority === 'HIGH' && 'font-medium text-fsm-warning-fg',
        priority === 'URGENT' && 'font-semibold text-fsm-critical-fg',
        className,
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          'size-3.5',
          priority === 'LOW' && 'text-text-3',
          priority === 'NORMAL' && 'text-text-3',
          priority === 'URGENT' && 'text-fsm-critical',
        )}
      />
      {t(`fsm.workOrders.priority.${priority}`)}
    </span>
  );
}

/** "Overdue" as a signal: alarm icon + word, red. */
export function OverdueBadge({ label }: { label?: string }) {
  const t = useT();

  return (
    <span
      data-testid="work-order-overdue"
      className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold whitespace-nowrap text-fsm-overdue"
    >
      <AlarmClock aria-hidden="true" className="size-3.5" />
      {label ?? t('fsm.workOrders.overdue')}
    </span>
  );
}
