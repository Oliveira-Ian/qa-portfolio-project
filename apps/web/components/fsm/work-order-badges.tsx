'use client';

import { AlertTriangle } from 'lucide-react';
import type { WorkOrderPriority, WorkOrderStatus } from '@oliveira/schemas';
import { StatusBadge } from '@/components/ui/badge';
import { useT } from '@/lib/i18n/provider';

const STATUS_TONE = {
  OPEN: 'info',
  SCHEDULED: 'info',
  IN_PROGRESS: 'warning',
  ON_HOLD: 'neutral',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
} as const;

export function WorkOrderStatusBadge({ status }: { status: WorkOrderStatus }) {
  const t = useT();

  return (
    <StatusBadge tone={STATUS_TONE[status]} data-testid="work-order-status">
      {t(`fsm.workOrders.status.${status}`)}
    </StatusBadge>
  );
}

const PRIORITY_TONE = {
  LOW: 'neutral',
  NORMAL: 'neutral',
  HIGH: 'warning',
  URGENT: 'danger',
} as const;

export function PriorityBadge({ priority }: { priority: WorkOrderPriority }) {
  const t = useT();

  return (
    <StatusBadge tone={PRIORITY_TONE[priority]} data-testid="work-order-priority">
      {t(`fsm.workOrders.priority.${priority}`)}
    </StatusBadge>
  );
}

export function OverdueBadge() {
  const t = useT();

  return (
    <StatusBadge tone="danger" data-testid="work-order-overdue">
      <AlertTriangle aria-hidden="true" className="size-3" />
      {t('fsm.workOrders.overdue')}
    </StatusBadge>
  );
}
