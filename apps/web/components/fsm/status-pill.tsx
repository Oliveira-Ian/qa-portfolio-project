'use client';

import type { EquipmentCriticality, EquipmentStatus, WorkOrderStatus } from '@oliveira/schemas';
import { useT } from '@/lib/i18n/provider';
import { cn } from '@/lib/utils';

/*
 * Oliveira FSM — Design System V2 pills (HANDOFF-FSM § 3, § 5.6): a dot and a
 * word, sentence case, on the status's own tint. One hue per work-order status,
 * everywhere (pill, chart series, timeline). Never the dot alone — two of the
 * dots are below 3:1 on white. Tokens exist only inside [data-product="fsm"].
 */
export type PillTone =
  | 'open'
  | 'scheduled'
  | 'in-progress'
  | 'on-hold'
  | 'completed'
  | 'cancelled'
  | 'critical'
  | 'warning';

const TONE_CLASS: Record<PillTone, { pill: string; dot: string }> = {
  open: { pill: 'bg-fsm-open-bg text-fsm-open-fg', dot: 'bg-fsm-open' },
  scheduled: { pill: 'bg-fsm-scheduled-bg text-fsm-scheduled-fg', dot: 'bg-fsm-scheduled' },
  'in-progress': {
    pill: 'bg-fsm-in-progress-bg text-fsm-in-progress-fg',
    dot: 'bg-fsm-in-progress',
  },
  'on-hold': { pill: 'bg-fsm-on-hold-bg text-fsm-on-hold-fg', dot: 'bg-fsm-on-hold' },
  completed: { pill: 'bg-fsm-completed-bg text-fsm-completed-fg', dot: 'bg-fsm-completed' },
  cancelled: { pill: 'bg-fsm-cancelled-bg text-fsm-cancelled-fg', dot: 'bg-fsm-cancelled' },
  critical: { pill: 'bg-fsm-critical-bg text-fsm-critical-fg', dot: 'bg-fsm-critical' },
  warning: { pill: 'bg-fsm-warning-bg text-fsm-warning-fg', dot: 'bg-fsm-warning' },
};

/** The status's hue as a CSS colour — for chart series, timeline markers, dispatch blocks. */
export const WORK_ORDER_STATUS_COLOR: Record<WorkOrderStatus, string> = {
  OPEN: 'var(--fsm-status-open)',
  SCHEDULED: 'var(--fsm-status-scheduled)',
  IN_PROGRESS: 'var(--fsm-status-in-progress)',
  ON_HOLD: 'var(--fsm-status-on-hold)',
  COMPLETED: 'var(--fsm-status-completed)',
  CANCELLED: 'var(--fsm-status-cancelled)',
};

export const WORK_ORDER_STATUS_TONE: Record<WorkOrderStatus, PillTone> = {
  OPEN: 'open',
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in-progress',
  ON_HOLD: 'on-hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

interface PillProps extends React.ComponentProps<'span'> {
  tone: PillTone;
}

export function Pill({ tone, className, children, ...props }: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full pr-2.5 pl-2 text-[12.5px] leading-none font-medium whitespace-nowrap',
        TONE_CLASS[tone].pill,
        className,
      )}
      {...props}
    >
      <i
        aria-hidden="true"
        className={cn('block size-[7px] shrink-0 rounded-full', TONE_CLASS[tone].dot)}
      />
      {children}
    </span>
  );
}

export function WorkOrderStatusPill({
  status,
  className,
}: {
  status: WorkOrderStatus;
  className?: string;
}) {
  const t = useT();

  return (
    <Pill
      tone={WORK_ORDER_STATUS_TONE[status]}
      data-testid="work-order-status"
      className={className}
    >
      {t(`fsm.workOrders.status.${status}`)}
    </Pill>
  );
}

const EQUIPMENT_TONE: Record<EquipmentStatus, PillTone> = {
  ACTIVE: 'completed',
  UNDER_MAINTENANCE: 'in-progress',
  INACTIVE: 'open',
};

export function EquipmentStatusPill({ status }: { status: EquipmentStatus }) {
  const t = useT();

  return (
    <Pill tone={EQUIPMENT_TONE[status]} data-testid="equipment-status">
      {t(`fsm.equipment.status.${status}`)}
    </Pill>
  );
}

/** Active / inactive records (customers, types, branches, catalog items). */
export function ActivePill({ isActive }: { isActive: boolean }) {
  const t = useT();

  return (
    <Pill tone={isActive ? 'completed' : 'open'}>
      {t(isActive ? 'fsm.status.active' : 'fsm.status.inactive')}
    </Pill>
  );
}

const CRITICALITY_TONE: Record<EquipmentCriticality, PillTone> = {
  LOW: 'open',
  MEDIUM: 'scheduled',
  HIGH: 'critical',
};

/** How much a failure hurts: High in the critical red, Medium blue, Low neutral. */
export function CriticalityPill({
  criticality,
  short = false,
}: {
  criticality: EquipmentCriticality;
  short?: boolean;
}) {
  const t = useT();

  return (
    <Pill tone={CRITICALITY_TONE[criticality]} data-testid="equipment-criticality">
      {t(short ? `fsmUi.criticality.short.${criticality}` : `fsmUi.criticality.${criticality}`)}
    </Pill>
  );
}
