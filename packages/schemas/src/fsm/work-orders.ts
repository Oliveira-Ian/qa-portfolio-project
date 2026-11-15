import { z } from 'zod';
import type { AddressDto } from '../address.js';
import { maxLengthMessage } from '../messages.js';
import type { CatalogItemKind, EquipmentCriticality } from './records.js';

/**
 * Oliveira FSM's work orders (plan § 2.5): the statuses, the transitions
 * between them, who may make each one, and the shapes the API and the screens
 * share. The transitions are a pure function so the API enforces exactly what
 * the screen offers.
 */

export const WORK_ORDER_STATUSES = [
  'OPEN',
  'SCHEDULED',
  'IN_PROGRESS',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
] as const;
export const workOrderStatusSchema = z.enum(WORK_ORDER_STATUSES);
export type WorkOrderStatus = z.infer<typeof workOrderStatusSchema>;

export const WORK_ORDER_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;
export const workOrderPrioritySchema = z.enum(WORK_ORDER_PRIORITIES);
export type WorkOrderPriority = z.infer<typeof workOrderPrioritySchema>;

/* -------------------------------------------------------------------------- */
/* Status machine                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Where each status can go. OPEN ↔ SCHEDULED is not a button: a work order is
 * SCHEDULED while it has a technician **and** a date, and OPEN otherwise —
 * editing those fields moves it. The rest are actions.
 */
const TRANSITIONS: Record<WorkOrderStatus, readonly WorkOrderStatus[]> = {
  OPEN: ['IN_PROGRESS', 'CANCELLED'],
  SCHEDULED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['ON_HOLD', 'COMPLETED', 'CANCELLED'],
  ON_HOLD: ['IN_PROGRESS', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

/** Completed and cancelled work orders are history: read-only. */
export function isFinalStatus(status: WorkOrderStatus): boolean {
  return status === 'COMPLETED' || status === 'CANCELLED';
}

/** Before the work starts: details, technician and date can still change freely. */
export function isPlanningStatus(status: WorkOrderStatus): boolean {
  return status === 'OPEN' || status === 'SCHEDULED';
}

/** OPEN or SCHEDULED, from the technician and the date — the planning statuses follow the plan. */
export function planningStatus(
  assigneeMembershipId: string | null,
  scheduledAt: unknown,
): WorkOrderStatus {
  return assigneeMembershipId && scheduledAt ? 'SCHEDULED' : 'OPEN';
}

/** What the caller may do with this work order, from their FSM permissions. */
export interface WorkOrderActor {
  /** `work-order:change-status`: schedule, put on hold, cancel — any work order. */
  canChangeStatus: boolean;
  /** `work-order:execute` and the work order's technician: start, hold, resume, complete their own. */
  isExecutingAssignee: boolean;
}

/** The statuses a technician moves their own work order through; cancelling is never theirs. */
const EXECUTION_TARGETS: readonly WorkOrderStatus[] = ['IN_PROGRESS', 'ON_HOLD', 'COMPLETED'];

/** The transitions this caller may make now — what the screen offers and the API accepts. */
export function allowedTransitions(
  status: WorkOrderStatus,
  actor: WorkOrderActor,
  hasAssignee: boolean,
): WorkOrderStatus[] {
  return TRANSITIONS[status].filter((to) => {
    // Nobody starts a work order without a technician.
    if (to === 'IN_PROGRESS' && !hasAssignee) {
      return false;
    }

    return actor.canChangeStatus || (actor.isExecutingAssignee && EXECUTION_TARGETS.includes(to));
  });
}

/* -------------------------------------------------------------------------- */
/* Writes                                                                      */
/* -------------------------------------------------------------------------- */

const text = (max: number) => z.string().trim().max(max, maxLengthMessage(max));

/** `''`, or a date and time as `<input type="datetime-local">` holds it: `yyyy-mm-ddThh:mm`. */
const localDateTime = z
  .string()
  .trim()
  .refine((value) => value === '' || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value), 'Invalid date');

/** `''` or a whole number of minutes, up to a week. */
const minutes = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === '' || (/^\d{1,5}$/.test(value) && Number(value) >= 1 && Number(value) <= 10080),
    'Invalid duration',
  );

/**
 * A work order's details — create and edit. Optional ids are `''`. Dates are
 * in the business time zone (`BUSINESS_TIME_ZONE`), sent with its UTC offset
 * in `timezoneOffset` so the API stores the right instant.
 */
export const workOrderWriteSchema = z
  .object({
    customerId: z.string().trim().min(1, 'Customer is required'),
    equipmentId: z.string().trim(),
    serviceAddressId: z.string().trim(),
    typeId: z.string().trim().min(1, 'Type is required'),
    branchId: z.string().trim(),
    title: z.string().trim().min(1, 'Title is required').max(160, maxLengthMessage(160)),
    description: text(4000),
    /** The customer's ticket or purchase-order number. */
    externalReference: text(60),
    /** One of the customer's contacts — who receives the technician; `''` for none. */
    contactId: z.string().trim(),
    priority: workOrderPrioritySchema,
    assigneeMembershipId: z.string().trim(),
    scheduledAt: localDateTime,
    /** How long the job should take on site, in minutes; `''` when unknown. */
    estimatedMinutes: minutes,
    dueAt: localDateTime,
  })
  .superRefine((data, ctx) => {
    if (data.scheduledAt && data.dueAt && data.dueAt < data.scheduledAt) {
      ctx.addIssue({
        code: 'custom',
        message: 'The due date cannot be before the scheduled date',
        path: ['dueAt'],
      });
    }
  });

export type WorkOrderWriteInput = z.infer<typeof workOrderWriteSchema>;
export type WorkOrderFormValues = WorkOrderWriteInput;

/** The request body: the form's values plus the business time zone's offset from UTC, in minutes. */
export const workOrderRequestSchema = z.object({
  values: workOrderWriteSchema,
  timezoneOffset: z.number().int().min(-840).max(840),
});

export type WorkOrderRequest = z.infer<typeof workOrderRequestSchema>;

export const emptyWorkOrderFormValues: WorkOrderFormValues = {
  customerId: '',
  equipmentId: '',
  serviceAddressId: '',
  typeId: '',
  branchId: '',
  title: '',
  description: '',
  externalReference: '',
  contactId: '',
  priority: 'NORMAL',
  assigneeMembershipId: '',
  scheduledAt: '',
  estimatedMinutes: '',
  dueAt: '',
};

/** A move to another status. Hold and cancel need a reason; completing needs what was done. */
export const workOrderStatusChangeSchema = z
  .object({
    to: workOrderStatusSchema,
    reason: text(1000).optional(),
    resolution: text(4000).optional(),
  })
  .superRefine((data, ctx) => {
    if ((data.to === 'ON_HOLD' || data.to === 'CANCELLED') && !data.reason) {
      ctx.addIssue({ code: 'custom', message: 'A reason is required', path: ['reason'] });
    }

    if (data.to === 'COMPLETED' && !data.resolution) {
      ctx.addIssue({
        code: 'custom',
        message: 'Describe the work done to complete the work order',
        path: ['resolution'],
      });
    }
  });

export type WorkOrderStatusChange = z.infer<typeof workOrderStatusChangeSchema>;

export const workOrderNoteSchema = z.object({
  message: z.string().trim().min(1, 'Write the note').max(2000, maxLengthMessage(2000)),
});

export type WorkOrderNoteInput = z.infer<typeof workOrderNoteSchema>;

export const workOrderItemWriteSchema = z.object({
  catalogItemId: z.string().trim().min(1, 'Choose a product or service'),
  /** A positive amount with up to three decimals ("1.5"). */
  quantity: z
    .string()
    .trim()
    .refine(
      (value) => /^\d{1,9}(\.\d{1,3})?$/.test(value) && Number(value) > 0,
      'Invalid quantity',
    ),
});

export type WorkOrderItemWriteInput = z.infer<typeof workOrderItemWriteSchema>;

/* -------------------------------------------------------------------------- */
/* Reads                                                                       */
/* -------------------------------------------------------------------------- */

export interface WorkOrderPersonRef {
  membershipId: string;
  name: string;
}

export interface WorkOrderListItemDto {
  id: string;
  number: number;
  title: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  customer: { id: string; name: string };
  equipment: { id: string; name: string; tag: string | null } | null;
  type: { id: string; name: string };
  branch: { id: string; code: string; name: string } | null;
  assignee: WorkOrderPersonRef | null;
  scheduledAt: string | null;
  /** Minutes on site; with `scheduledAt` it gives the planned end. */
  estimatedMinutes: number | null;
  startedAt: string | null;
  dueAt: string | null;
  /** Past its due date and not finished. */
  isOverdue: boolean;
  city: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface WorkOrderItemDto {
  id: string;
  catalogItemId: string;
  kind: CatalogItemKind;
  name: string;
  unit: string;
  unitPrice: string | null;
  quantity: string;
  createdAt: string;
}

export const WORK_ORDER_EVENT_TYPES = [
  'CREATED',
  'UPDATED',
  'ASSIGNED',
  'UNASSIGNED',
  'STATUS_CHANGED',
  'NOTE',
  'ITEM_ADDED',
  'ITEM_REMOVED',
] as const;
export type WorkOrderEventType = (typeof WORK_ORDER_EVENT_TYPES)[number];

export interface WorkOrderEventDto {
  id: string;
  type: WorkOrderEventType;
  fromStatus: WorkOrderStatus | null;
  toStatus: WorkOrderStatus | null;
  message: string | null;
  actorName: string;
  createdAt: string;
}

export interface WorkOrderContactDto {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
  mobile: string | null;
}

export interface WorkOrderDto extends WorkOrderListItemDto {
  description: string | null;
  externalReference: string | null;
  /** Who receives the technician on site. */
  contact: WorkOrderContactDto | null;
  /** What every technician must know before arriving — the customer's instructions. */
  serviceInstructions: string | null;
  customerPhone: string | null;
  equipmentDetails: {
    manufacturer: string | null;
    model: string | null;
    category: string | null;
    criticality: EquipmentCriticality | null;
    lastServiceAt: string | null;
  } | null;
  serviceAddress: (AddressDto & { serviceHours: string | null }) | null;
  /** The rules of its type: whether equipment is required, whether it counts as preventive. */
  typeRules: { requiresEquipment: boolean; countsAsPreventive: boolean };
  cancelledAt: string | null;
  holdReason: string | null;
  cancellationReason: string | null;
  resolution: string | null;
  createdBy: string;
  items: WorkOrderItemDto[];
  /** Newest first. */
  events: WorkOrderEventDto[];
}

/** A member who can be a work order's technician: an FSM seat and `work-order:execute`. */
export interface TechnicianDto {
  membershipId: string;
  name: string;
}

/**
 * What the work order list can be filtered by, for whoever may read work
 * orders: every type and branch (inactive ones too — old work orders carry
 * them) and the technicians.
 */
export interface WorkOrderFilterOptionsDto {
  types: { id: string; name: string }[];
  branches: { id: string; code: string; name: string }[];
  technicians: TechnicianDto[];
}

/**
 * The time zone work orders are scheduled in. One for the V1 — the product
 * serves Brazilian companies — so the server and the browser render the same
 * time (no hydration mismatch) and nobody's laptop clock changes a schedule.
 * A per-company time zone would replace this constant.
 */
export const BUSINESS_TIME_ZONE = 'America/Sao_Paulo';

const zoneParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUSINESS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function partsAt(date: Date): Record<'year' | 'month' | 'day' | 'hour' | 'minute', string> {
  const parts = Object.fromEntries(
    zoneParts.formatToParts(date).map((part) => [part.type, part.value]),
  );

  return {
    year: parts.year ?? '',
    month: parts.month ?? '',
    day: parts.day ?? '',
    hour: parts.hour ?? '',
    minute: parts.minute ?? '',
  };
}

/** `yyyy-mm-ddThh:mm` in the business time zone, for a date-time field; `''` for none. */
export function toLocalDateTimeInput(iso: string | null): string {
  if (!iso) {
    return '';
  }

  const { year, month, day, hour, minute } = partsAt(new Date(iso));

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/** The business time zone's offset from UTC, in minutes (UTC − local): 180 for São Paulo. */
export function businessUtcOffsetMinutes(at: Date = new Date()): number {
  const { year, month, day, hour, minute } = partsAt(at);
  const asUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );

  return Math.round((at.getTime() - (at.getTime() % 60_000) - asUtc) / 60_000);
}

export function workOrderToFormValues(workOrder: WorkOrderDto): WorkOrderFormValues {
  return {
    customerId: workOrder.customer.id,
    equipmentId: workOrder.equipment?.id ?? '',
    serviceAddressId: workOrder.serviceAddress?.id ?? '',
    typeId: workOrder.type.id,
    branchId: workOrder.branch?.id ?? '',
    title: workOrder.title,
    description: workOrder.description ?? '',
    externalReference: workOrder.externalReference ?? '',
    contactId: workOrder.contact?.id ?? '',
    priority: workOrder.priority,
    assigneeMembershipId: workOrder.assignee?.membershipId ?? '',
    scheduledAt: toLocalDateTimeInput(workOrder.scheduledAt),
    estimatedMinutes: workOrder.estimatedMinutes?.toString() ?? '',
    dueAt: toLocalDateTimeInput(workOrder.dueAt),
  };
}

/** `#1042`. */
export function formatWorkOrderNumber(number: number): string {
  return `#${number}`;
}

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * `GET /api/fsm/dashboard`: the operation at a glance. `scope` is `all` for
 * whoever sees every work order and `mine` for a technician, whose numbers
 * count only the work orders assigned to them.
 */
export interface FsmDashboardDto {
  scope: 'all' | 'mine';
  byStatus: Record<WorkOrderStatus, number>;
  overdue: number;
  scheduledToday: number;
  completedLast30Days: number;
  /** The next scheduled work orders, soonest first. */
  upcoming: WorkOrderListItemDto[];
  /** The latest work orders opened. */
  recent: WorkOrderListItemDto[];
  /** Open work orders without a technician. */
  unassigned: number;
  /** Overdue ones that are urgent. */
  overdueUrgent: number;
  /** Completed per week, the last four weeks, oldest first (`weekStart` is a `yyyy-mm-dd` Monday). */
  completedPerWeek: { weekStart: string; count: number }[];
  /** Scheduled per day, today and the next six (`date` is `yyyy-mm-dd`). */
  scheduledNext7Days: { date: string; count: number }[];
  /** Every work order (cancelled ones excluded) per type, most first. */
  byType: { typeId: string; name: string; count: number; countsAsPreventive: boolean }[];
  /** Unfinished work orders per priority. */
  openByPriority: Record<WorkOrderPriority, number>;
  /** Unfinished work orders per technician, and how many are scheduled today. */
  teamLoad: { membershipId: string; name: string; open: number; today: number }[];
  /** Today's plan: scheduled for today, plus whatever is in progress. */
  dispatch: WorkOrderListItemDto[];
  /** Overdue first, then on hold. */
  needsAttention: WorkOrderListItemDto[];
}

/** Midnight today in the business time zone, as an instant. */
export function startOfBusinessDay(now: Date = new Date()): Date {
  const local = new Date(now.getTime() - businessUtcOffsetMinutes(now) * 60_000);

  return new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) +
      businessUtcOffsetMinutes(now) * 60_000,
  );
}
