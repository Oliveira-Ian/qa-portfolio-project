import {
  WORK_ORDER_STATUSES,
  allowedTransitions,
  isFinalStatus,
  isPlanningStatus,
  planningStatus,
  startOfBusinessDay,
  type FsmDashboardDto,
  type FsmListQuery,
  type PaginatedResult,
  type TechnicianDto,
  type WorkOrderDto,
  type WorkOrderItemWriteInput,
  type WorkOrderListItemDto,
  type WorkOrderStatusChange,
  type WorkOrderWriteInput,
} from '@oliveira/schemas';
import type { Prisma } from '../../../generated/prisma/client.js';
import { prisma, withTransaction, type TransactionClient } from '../../../config/prisma.js';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../../shared/errors.js';
import {
  buildFiltersWhere,
  resolveSort,
  toSkipTake,
  type FilterFieldMap,
} from '../../../shared/list-query.js';
import { requireCompanyId } from '../../../shared/request-context.js';
import { toAddressDto } from '../../address/address-sync.js';

/**
 * Who is asking, as the work orders see it: their account (for the history),
 * their membership (are they the technician?) and their FSM permissions.
 */
export interface WorkOrderCaller {
  accountId: number;
  name: string;
  membershipId: string | null;
  can: {
    view: boolean;
    create: boolean;
    edit: boolean;
    assign: boolean;
    changeStatus: boolean;
    execute: boolean;
  };
}

const FILTERS: FilterFieldMap = {
  status: { field: 'status', kind: 'enumScalar' },
  priority: { field: 'priority', kind: 'enumScalar' },
  title: { field: 'title', kind: 'text' },
  customer: { field: 'customer.person.name', kind: 'text' },
  equipment: { field: 'equipment.name', kind: 'text' },
  type: { field: 'type.name', kind: 'text' },
  branch: { field: 'branch.name', kind: 'text' },
  assignee: { field: 'assignee.account.name', kind: 'text' },
  scheduledAt: { field: 'scheduledAt', kind: 'date' },
  dueAt: { field: 'dueAt', kind: 'date' },
  createdAt: { field: 'createdAt', kind: 'date' },
};

const SORTS: Record<string, string> = {
  number: 'number',
  title: 'title',
  status: 'status',
  priority: 'priority',
  customer: 'customer.person.name',
  scheduledAt: 'scheduledAt',
  dueAt: 'dueAt',
  createdAt: 'createdAt',
};

const LIST_INCLUDE = {
  customer: { include: { person: { select: { name: true } } } },
  equipment: { select: { id: true, name: true } },
  type: { select: { id: true, name: true } },
  branch: { select: { id: true, code: true, name: true } },
  assignee: { select: { id: true, account: { select: { name: true } } } },
  serviceAddress: true,
} satisfies Prisma.WorkOrderInclude;

const RECORD_INCLUDE = {
  ...LIST_INCLUDE,
  items: { orderBy: { createdAt: 'asc' } },
  events: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] },
} satisfies Prisma.WorkOrderInclude;

type ListRow = Prisma.WorkOrderGetPayload<{ include: typeof LIST_INCLUDE }>;
type RecordRow = Prisma.WorkOrderGetPayload<{ include: typeof RECORD_INCLUDE }>;

const iso = (value: Date | null): string | null => (value ? value.toISOString() : null);

function toListDto(row: ListRow, now = new Date()): WorkOrderListItemDto {
  return {
    id: row.id,
    number: row.number,
    title: row.title,
    status: row.status,
    priority: row.priority,
    customer: { id: row.customer.id, name: row.customer.person.name },
    equipment: row.equipment,
    type: row.type,
    branch: row.branch,
    assignee: row.assignee
      ? { membershipId: row.assignee.id, name: row.assignee.account.name }
      : null,
    scheduledAt: iso(row.scheduledAt),
    dueAt: iso(row.dueAt),
    isOverdue: row.dueAt !== null && row.dueAt < now && !isFinalStatus(row.status),
    city: row.serviceAddress?.city ?? null,
    createdAt: row.createdAt.toISOString(),
    completedAt: iso(row.completedAt),
  };
}

function toDto(row: RecordRow, createdBy: string): WorkOrderDto {
  return {
    ...toListDto(row),
    description: row.description,
    serviceAddress: row.serviceAddress ? toAddressDto(row.serviceAddress) : null,
    startedAt: iso(row.startedAt),
    cancelledAt: iso(row.cancelledAt),
    holdReason: row.holdReason,
    cancellationReason: row.cancellationReason,
    resolution: row.resolution,
    createdBy,
    items: row.items.map((item) => ({
      id: item.id,
      catalogItemId: item.catalogItemId,
      kind: item.kind,
      name: item.name,
      unit: item.unit,
      unitPrice: item.unitPrice === null ? null : item.unitPrice.toFixed(2),
      quantity: item.quantity.toString(),
      createdAt: item.createdAt.toISOString(),
    })),
    events: row.events.map((event) => ({
      id: event.id,
      type: event.type,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      message: event.message,
      actorName: event.actorName,
      createdAt: event.createdAt.toISOString(),
    })),
  };
}

/** `yyyy-mm-ddThh:mm` in the caller's time + their offset (minutes, UTC − local) → the instant. */
function toInstant(local: string, timezoneOffset: number): Date | null {
  if (local === '') {
    return null;
  }

  return new Date(new Date(`${local}:00.000Z`).getTime() + timezoneOffset * 60_000);
}

/**
 * A technician sees the work orders assigned to them; `work-order:view` sees
 * every one. Anything else is "not found", never "forbidden" — the same answer
 * as another company's work order.
 */
function visibleTo(caller: WorkOrderCaller): Prisma.WorkOrderWhereInput {
  if (caller.can.view) {
    return {};
  }

  return { assigneeMembershipId: caller.membershipId ?? '—' };
}

function isExecutingAssignee(
  caller: WorkOrderCaller,
  assigneeMembershipId: string | null,
): boolean {
  return (
    caller.can.execute &&
    caller.membershipId !== null &&
    caller.membershipId === assigneeMembershipId
  );
}

/** Members with an FSM seat whose FSM profile grants `work-order:execute`. */
function technicianWhere(): Prisma.MembershipWhereInput {
  return {
    companyId: requireCompanyId(),
    status: 'ACTIVE',
    productAccess: { some: { product: 'FSM' } },
    profiles: {
      some: {
        product: 'FSM',
        profile: {
          permissions: {
            some: { permission: { product: 'FSM', resource: 'work-order', action: 'execute' } },
          },
        },
      },
    },
  };
}

/**
 * The records a work order points at belong together: the equipment and the
 * address are the customer's, the type and the branch are active, and the
 * technician can be one. The database only knows they are the same company's.
 */
async function checkReferences(tx: TransactionClient, input: WorkOrderWriteInput): Promise<void> {
  const customer = await tx.customer.findUnique({ where: { id: input.customerId } });

  if (!customer) {
    throw new BadRequestError('Customer not found');
  }

  if (input.equipmentId) {
    const equipment = await tx.equipment.findUnique({ where: { id: input.equipmentId } });

    if (!equipment || equipment.customerId !== customer.id) {
      throw new BadRequestError("The equipment must be one of the customer's");
    }
  }

  if (input.serviceAddressId) {
    const address = await tx.address.findUnique({ where: { id: input.serviceAddressId } });

    if (!address || address.personId !== customer.personId) {
      throw new BadRequestError("The address must be one of the customer's addresses");
    }
  }

  const type = await tx.workOrderType.findUnique({ where: { id: input.typeId } });

  if (!type) {
    throw new BadRequestError('Work order type not found');
  }

  if (input.branchId && !(await tx.branch.findUnique({ where: { id: input.branchId } }))) {
    throw new BadRequestError('Branch not found');
  }

  if (input.assigneeMembershipId) {
    const technician = await tx.membership.findFirst({
      where: { ...technicianWhere(), id: input.assigneeMembershipId },
    });

    if (!technician) {
      throw new BadRequestError(
        'The technician must have the FSM and permission to execute work orders',
      );
    }
  }
}

/** The next number of the company's work orders, bumped inside the caller's transaction. */
async function nextNumber(tx: TransactionClient): Promise<number> {
  const rows = await tx.$queryRaw<{ value: number }[]>`
    INSERT INTO "FsmCounter" ("companyId", "key", "value")
    VALUES (${requireCompanyId()}, 'work-order', 1)
    ON CONFLICT ("companyId", "key") DO UPDATE SET "value" = "FsmCounter"."value" + 1
    RETURNING "value"`;

  return rows[0]!.value;
}

async function addEvent(
  tx: TransactionClient,
  workOrderId: string,
  caller: WorkOrderCaller,
  event: Omit<
    Prisma.WorkOrderEventUncheckedCreateInput,
    'companyId' | 'workOrderId' | 'actorAccountId' | 'actorName'
  >,
): Promise<void> {
  await tx.workOrderEvent.create({
    data: {
      ...event,
      companyId: requireCompanyId(),
      workOrderId,
      actorAccountId: caller.accountId,
      actorName: caller.name,
    },
  });
}

async function loadRecord(
  client: TransactionClient | typeof prisma,
  id: string,
  caller: WorkOrderCaller,
): Promise<WorkOrderDto> {
  const row = await client.workOrder.findFirst({
    where: { id, ...visibleTo(caller) },
    include: RECORD_INCLUDE,
  });

  if (!row) {
    throw new NotFoundError('Work order not found');
  }

  const creator = await client.accessAccount.findUnique({
    where: { id: row.createdById },
    select: { name: true },
  });

  return toDto(row, creator?.name ?? '—');
}

/** The work order as the caller may see it, locked for the change about to be made. */
async function findForChange(tx: TransactionClient, id: string, caller: WorkOrderCaller) {
  const row = await tx.workOrder.findFirst({ where: { id, ...visibleTo(caller) } });

  if (!row) {
    throw new NotFoundError('Work order not found');
  }

  return row;
}

export const workOrderService = {
  /**
   * The operation at a glance — every work order for whoever sees them all,
   * the caller's own for a technician. All counted by the database.
   */
  async dashboard(caller: WorkOrderCaller): Promise<FsmDashboardDto> {
    const now = new Date();
    const today = startOfBusinessDay(now);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60_000);
    const scope: Prisma.WorkOrderWhereInput = caller.can.view
      ? {}
      : { assigneeMembershipId: caller.membershipId ?? '—' };
    const unfinished = { status: { notIn: ['COMPLETED' as const, 'CANCELLED' as const] } };

    const [grouped, overdue, scheduledToday, completedLast30Days, upcoming, recent] =
      await Promise.all([
        prisma.workOrder.groupBy({ by: ['status'], where: scope, _count: { _all: true } }),
        prisma.workOrder.count({ where: { ...scope, ...unfinished, dueAt: { lt: now } } }),
        prisma.workOrder.count({
          where: { ...scope, ...unfinished, scheduledAt: { gte: today, lt: tomorrow } },
        }),
        prisma.workOrder.count({
          where: {
            ...scope,
            status: 'COMPLETED',
            completedAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60_000) },
          },
        }),
        prisma.workOrder.findMany({
          where: {
            ...scope,
            status: { in: ['SCHEDULED', 'IN_PROGRESS', 'ON_HOLD'] },
            scheduledAt: { gte: today },
          },
          orderBy: [{ scheduledAt: 'asc' }, { number: 'asc' }],
          take: 5,
          include: LIST_INCLUDE,
        }),
        prisma.workOrder.findMany({
          where: scope,
          orderBy: [{ createdAt: 'desc' }, { number: 'desc' }],
          take: 5,
          include: LIST_INCLUDE,
        }),
      ]);

    const byStatus = Object.fromEntries(
      WORK_ORDER_STATUSES.map((status) => [
        status,
        grouped.find((group) => group.status === status)?._count._all ?? 0,
      ]),
    ) as FsmDashboardDto['byStatus'];

    return {
      scope: caller.can.view ? 'all' : 'mine',
      byStatus,
      overdue,
      scheduledToday,
      completedLast30Days,
      upcoming: upcoming.map((row) => toListDto(row, now)),
      recent: recent.map((row) => toListDto(row, now)),
    };
  },

  async list(
    query: FsmListQuery,
    raw: Record<string, unknown>,
    caller: WorkOrderCaller,
  ): Promise<PaginatedResult<WorkOrderListItemDto>> {
    const now = new Date();
    const search = query.search?.trim();
    const number = search && /^#?\d+$/.test(search) ? Number(search.replace('#', '')) : undefined;
    const where: Prisma.WorkOrderWhereInput = {
      AND: [
        visibleTo(caller),
        raw.mine === 'true' ? { assigneeMembershipId: caller.membershipId ?? '—' } : {},
        raw.overdue === 'true'
          ? { dueAt: { lt: now }, status: { notIn: ['COMPLETED', 'CANCELLED'] } }
          : {},
        typeof raw.customerId === 'string' ? { customerId: raw.customerId } : {},
        typeof raw.equipmentId === 'string' ? { equipmentId: raw.equipmentId } : {},
        search
          ? {
              OR: [
                ...(number !== undefined ? [{ number }] : []),
                { title: { contains: search, mode: 'insensitive' } },
                { customer: { person: { name: { contains: search, mode: 'insensitive' } } } },
              ],
            }
          : {},
        buildFiltersWhere(raw, FILTERS) as Prisma.WorkOrderWhereInput,
      ],
    };
    const orderBy = resolveSort(
      query.sortBy,
      query.sortOrder,
      SORTS,
      { number: 'desc' },
      { id: 'asc' },
    ) as Prisma.WorkOrderOrderByWithRelationInput[];
    const [rows, total] = await Promise.all([
      prisma.workOrder.findMany({ where, orderBy, include: LIST_INCLUDE, ...toSkipTake(query) }),
      prisma.workOrder.count({ where }),
    ]);

    return {
      items: rows.map((row) => toListDto(row, now)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  },

  getById(id: string, caller: WorkOrderCaller): Promise<WorkOrderDto> {
    return loadRecord(prisma, id, caller);
  },

  async technicians(): Promise<TechnicianDto[]> {
    const rows = await prisma.membership.findMany({
      where: technicianWhere(),
      select: { id: true, account: { select: { name: true } } },
      orderBy: { account: { name: 'asc' } },
    });

    return rows.map((row) => ({ membershipId: row.id, name: row.account.name }));
  },

  async create(
    input: WorkOrderWriteInput,
    timezoneOffset: number,
    caller: WorkOrderCaller,
  ): Promise<WorkOrderDto> {
    if (input.assigneeMembershipId && !caller.can.assign) {
      throw new ForbiddenError();
    }

    return withTransaction(async (tx) => {
      await checkReferences(tx, input);

      const assignee = input.assigneeMembershipId || null;
      const scheduledAt = toInstant(input.scheduledAt, timezoneOffset);
      const status = planningStatus(assignee, scheduledAt);
      const row = await tx.workOrder.create({
        data: {
          companyId: requireCompanyId(),
          number: await nextNumber(tx),
          customerId: input.customerId,
          equipmentId: input.equipmentId || null,
          serviceAddressId: input.serviceAddressId || null,
          typeId: input.typeId,
          branchId: input.branchId || null,
          title: input.title,
          description: input.description || null,
          priority: input.priority,
          status,
          assigneeMembershipId: assignee,
          scheduledAt,
          dueAt: toInstant(input.dueAt, timezoneOffset),
          createdById: caller.accountId,
        },
      });

      await addEvent(tx, row.id, caller, { type: 'CREATED', toStatus: status });

      return loadRecord(tx, row.id, caller);
    });
  },

  /**
   * The details of a work order not yet finished. While it is being planned,
   * its status follows the technician and the date (OPEN ↔ SCHEDULED).
   */
  async update(
    id: string,
    input: WorkOrderWriteInput,
    timezoneOffset: number,
    caller: WorkOrderCaller,
  ): Promise<WorkOrderDto> {
    return withTransaction(async (tx) => {
      const current = await findForChange(tx, id, caller);

      if (isFinalStatus(current.status)) {
        throw new ConflictError('A completed or cancelled work order cannot be changed');
      }

      const assignee = input.assigneeMembershipId || null;

      if (assignee !== current.assigneeMembershipId && !caller.can.assign) {
        throw new ForbiddenError();
      }

      if (input.customerId !== current.customerId && !isPlanningStatus(current.status)) {
        throw new ConflictError('The customer cannot change once the work has started');
      }

      await checkReferences(tx, input);

      const scheduledAt = toInstant(input.scheduledAt, timezoneOffset);
      const status = isPlanningStatus(current.status)
        ? planningStatus(assignee, scheduledAt)
        : current.status;

      await tx.workOrder.update({
        where: { id },
        data: {
          customerId: input.customerId,
          equipmentId: input.equipmentId || null,
          serviceAddressId: input.serviceAddressId || null,
          typeId: input.typeId,
          branchId: input.branchId || null,
          title: input.title,
          description: input.description || null,
          priority: input.priority,
          status,
          assigneeMembershipId: assignee,
          scheduledAt,
          dueAt: toInstant(input.dueAt, timezoneOffset),
        },
      });

      await addEvent(tx, id, caller, { type: 'UPDATED' });

      if (assignee !== current.assigneeMembershipId) {
        const technician = assignee
          ? await tx.membership.findUnique({
              where: { id: assignee },
              select: { account: { select: { name: true } } },
            })
          : null;

        await addEvent(tx, id, caller, {
          type: assignee ? 'ASSIGNED' : 'UNASSIGNED',
          message: technician?.account.name ?? null,
        });
      }

      if (status !== current.status) {
        await addEvent(tx, id, caller, {
          type: 'STATUS_CHANGED',
          fromStatus: current.status,
          toStatus: status,
        });
      }

      return loadRecord(tx, id, caller);
    });
  },

  async changeStatus(
    id: string,
    change: WorkOrderStatusChange,
    caller: WorkOrderCaller,
  ): Promise<WorkOrderDto> {
    return withTransaction(async (tx) => {
      const current = await findForChange(tx, id, caller);
      const allowed = allowedTransitions(
        current.status,
        {
          canChangeStatus: caller.can.changeStatus,
          isExecutingAssignee: isExecutingAssignee(caller, current.assigneeMembershipId),
        },
        current.assigneeMembershipId !== null,
      );

      if (!allowed.includes(change.to)) {
        throw new ConflictError(`A work order cannot go from ${current.status} to ${change.to}`);
      }

      const now = new Date();
      const data: Prisma.WorkOrderUncheckedUpdateInput = { status: change.to };

      if (change.to === 'IN_PROGRESS') {
        data.startedAt = current.startedAt ?? now;
        data.holdReason = null;
      } else if (change.to === 'ON_HOLD') {
        data.holdReason = change.reason ?? null;
      } else if (change.to === 'COMPLETED') {
        data.completedAt = now;
        data.resolution = change.resolution ?? null;
      } else if (change.to === 'CANCELLED') {
        data.cancelledAt = now;
        data.cancellationReason = change.reason ?? null;
      }

      await tx.workOrder.update({ where: { id }, data });
      await addEvent(tx, id, caller, {
        type: 'STATUS_CHANGED',
        fromStatus: current.status,
        toStatus: change.to,
        message: change.to === 'COMPLETED' ? (change.resolution ?? null) : (change.reason ?? null),
      });

      return loadRecord(tx, id, caller);
    });
  },

  /** A note on the history — by whoever works on it or manages it. */
  async addNote(id: string, message: string, caller: WorkOrderCaller): Promise<WorkOrderDto> {
    return withTransaction(async (tx) => {
      const current = await findForChange(tx, id, caller);

      if (
        !caller.can.edit &&
        !caller.can.changeStatus &&
        !isExecutingAssignee(caller, current.assigneeMembershipId)
      ) {
        throw new ForbiddenError();
      }

      await addEvent(tx, id, caller, { type: 'NOTE', message });

      return loadRecord(tx, id, caller);
    });
  },

  /** Materials and services are recorded while the work is under way (or paused). */
  async addItem(
    id: string,
    input: WorkOrderItemWriteInput,
    caller: WorkOrderCaller,
  ): Promise<WorkOrderDto> {
    return withTransaction(async (tx) => {
      const current = await findForChange(tx, id, caller);

      checkItemsEditable(current.status, caller, current.assigneeMembershipId);

      const item = await tx.catalogItem.findUnique({ where: { id: input.catalogItemId } });

      if (!item || !item.active) {
        throw new BadRequestError('Product or service not found');
      }

      await tx.workOrderItem.create({
        data: {
          companyId: requireCompanyId(),
          workOrderId: id,
          catalogItemId: item.id,
          kind: item.kind,
          name: item.name,
          unit: item.unit,
          unitPrice: item.price,
          quantity: input.quantity,
          createdById: caller.accountId,
        },
      });
      await addEvent(tx, id, caller, {
        type: 'ITEM_ADDED',
        message: `${input.quantity} ${item.unit} · ${item.name}`,
      });

      return loadRecord(tx, id, caller);
    });
  },

  async removeItem(id: string, itemId: string, caller: WorkOrderCaller): Promise<WorkOrderDto> {
    return withTransaction(async (tx) => {
      const current = await findForChange(tx, id, caller);

      checkItemsEditable(current.status, caller, current.assigneeMembershipId);

      const item = await tx.workOrderItem.findFirst({ where: { id: itemId, workOrderId: id } });

      if (!item) {
        throw new NotFoundError('Item not found');
      }

      await tx.workOrderItem.delete({ where: { id: itemId } });
      await addEvent(tx, id, caller, {
        type: 'ITEM_REMOVED',
        message: `${item.quantity.toString()} ${item.unit} · ${item.name}`,
      });

      return loadRecord(tx, id, caller);
    });
  },
};

function checkItemsEditable(
  status: WorkOrderDto['status'],
  caller: WorkOrderCaller,
  assigneeMembershipId: string | null,
): void {
  if (status !== 'IN_PROGRESS' && status !== 'ON_HOLD') {
    throw new ConflictError('Materials and services are recorded while the work is in progress');
  }

  if (!caller.can.edit && !isExecutingAssignee(caller, assigneeMembershipId)) {
    throw new ForbiddenError();
  }
}
