import {
  WORK_ORDER_PRIORITIES,
  WORK_ORDER_STATUSES,
  allowedTransitions,
  isFinalStatus,
  isPlanningStatus,
  planningStatus,
  startOfBusinessDay,
  toLocalDateTimeInput,
  type FsmDashboardDto,
  type FsmListQuery,
  type PaginatedResult,
  type TechnicianDto,
  type WorkOrderDto,
  type WorkOrderFilterOptionsDto,
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
  // Picked from a list (several at once), so by id rather than by a typed name.
  type: { field: 'typeId', kind: 'enumScalar' },
  branch: { field: 'branchId', kind: 'enumScalar' },
  assignee: { field: 'assigneeMembershipId', kind: 'enumScalar' },
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
  equipment: { select: { id: true, name: true, tag: true } },
  type: { select: { id: true, name: true } },
  branch: { select: { id: true, code: true, name: true } },
  assignee: { select: { id: true, account: { select: { name: true } } } },
  serviceAddress: true,
} satisfies Prisma.WorkOrderInclude;

const RECORD_INCLUDE = {
  ...LIST_INCLUDE,
  customer: { include: { person: { select: { name: true, phone: true, mobile: true } } } },
  equipment: {
    select: {
      id: true,
      name: true,
      tag: true,
      manufacturer: true,
      model: true,
      category: true,
      criticality: true,
    },
  },
  type: { select: { id: true, name: true, requiresEquipment: true, countsAsPreventive: true } },
  contact: { select: { id: true, name: true, role: true, phone: true, mobile: true } },
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
    equipment: row.equipment
      ? { id: row.equipment.id, name: row.equipment.name, tag: row.equipment.tag }
      : null,
    type: { id: row.type.id, name: row.type.name },
    branch: row.branch,
    assignee: row.assignee
      ? { membershipId: row.assignee.id, name: row.assignee.account.name }
      : null,
    scheduledAt: iso(row.scheduledAt),
    estimatedMinutes: row.estimatedMinutes,
    startedAt: iso(row.startedAt),
    dueAt: iso(row.dueAt),
    isOverdue: row.dueAt !== null && row.dueAt < now && !isFinalStatus(row.status),
    city: row.serviceAddress?.city ?? null,
    createdAt: row.createdAt.toISOString(),
    completedAt: iso(row.completedAt),
  };
}

function toDto(row: RecordRow, createdBy: string, lastServiceAt: Date | null): WorkOrderDto {
  return {
    ...toListDto(row),
    description: row.description,
    externalReference: row.externalReference,
    contact: row.contact,
    serviceInstructions: row.customer.serviceInstructions,
    customerPhone: row.customer.person.phone ?? row.customer.person.mobile,
    equipmentDetails: row.equipment
      ? {
          manufacturer: row.equipment.manufacturer,
          model: row.equipment.model,
          category: row.equipment.category,
          criticality: row.equipment.criticality,
          lastServiceAt: iso(lastServiceAt),
        }
      : null,
    serviceAddress: row.serviceAddress ? toAddressDto(row.serviceAddress) : null,
    typeRules: {
      requiresEquipment: row.type.requiresEquipment,
      countsAsPreventive: row.type.countsAsPreventive,
    },
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

/** `yyyy-mm-dd` of an instant in the business time zone. */
function localDay(at: Date): string {
  return toLocalDateTimeInput(at.toISOString()).slice(0, 10);
}

const DAY_MS = 24 * 60 * 60_000;

/** A calendar day plus `days`, as `yyyy-mm-dd` (calendar arithmetic, no time zone). */
function addDays(day: string, days: number): string {
  return new Date(Date.parse(`${day}T00:00:00.000Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** The Monday of the week a calendar day falls in. */
function mondayOf(day: string): string {
  const weekday = new Date(`${day}T00:00:00.000Z`).getUTCDay();
  return addDays(day, -((weekday + 6) % 7));
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

  if (type.requiresEquipment && !input.equipmentId) {
    throw new BadRequestError('This type of work order needs the equipment');
  }

  if (input.contactId) {
    const contact = await tx.contact.findUnique({ where: { id: input.contactId } });

    if (!contact || contact.personId !== customer.personId) {
      throw new BadRequestError("The contact must be one of the customer's contacts");
    }
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

  const [creator, lastService] = await Promise.all([
    client.accessAccount.findUnique({ where: { id: row.createdById }, select: { name: true } }),
    row.equipmentId
      ? client.workOrder.findFirst({
          where: { equipmentId: row.equipmentId, status: 'COMPLETED', id: { not: row.id } },
          orderBy: { completedAt: 'desc' },
          select: { completedAt: true },
        })
      : null,
  ]);

  return toDto(row, creator?.name ?? '—', lastService?.completedAt ?? null);
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

    const weekStart = mondayOf(localDay(now));
    const firstWeek = addDays(weekStart, -21);
    const inSevenDays = new Date(today.getTime() + 7 * DAY_MS);
    const [
      unassigned,
      overdueUrgent,
      completed,
      scheduledAhead,
      perType,
      types,
      perPriority,
      perTechnician,
      perTechnicianToday,
      technicians,
      dispatch,
      overdueRows,
      onHoldRows,
    ] = await Promise.all([
      prisma.workOrder.count({ where: { ...scope, ...unfinished, assigneeMembershipId: null } }),
      prisma.workOrder.count({
        where: { ...scope, ...unfinished, dueAt: { lt: now }, priority: 'URGENT' },
      }),
      prisma.workOrder.findMany({
        where: {
          ...scope,
          status: 'COMPLETED',
          completedAt: { gte: new Date(`${firstWeek}T00:00:00.000Z`) },
        },
        select: { completedAt: true },
      }),
      prisma.workOrder.findMany({
        where: { ...scope, ...unfinished, scheduledAt: { gte: today, lt: inSevenDays } },
        select: { scheduledAt: true },
      }),
      prisma.workOrder.groupBy({
        by: ['typeId'],
        where: { ...scope, status: { not: 'CANCELLED' } },
        _count: { _all: true },
      }),
      prisma.workOrderType.findMany({ select: { id: true, name: true, countsAsPreventive: true } }),
      prisma.workOrder.groupBy({
        by: ['priority'],
        where: { ...scope, ...unfinished },
        _count: { _all: true },
      }),
      prisma.workOrder.groupBy({
        by: ['assigneeMembershipId'],
        where: { ...scope, ...unfinished, assigneeMembershipId: { not: null } },
        _count: { _all: true },
      }),
      prisma.workOrder.groupBy({
        by: ['assigneeMembershipId'],
        where: {
          ...scope,
          ...unfinished,
          assigneeMembershipId: { not: null },
          scheduledAt: { gte: today, lt: tomorrow },
        },
        _count: { _all: true },
      }),
      caller.can.view ? workOrderService.technicians() : Promise.resolve([] as TechnicianDto[]),
      prisma.workOrder.findMany({
        where: {
          ...scope,
          status: { not: 'CANCELLED' },
          OR: [{ scheduledAt: { gte: today, lt: tomorrow } }, { status: 'IN_PROGRESS' }],
        },
        orderBy: [{ scheduledAt: 'asc' }, { number: 'asc' }],
        take: 40,
        include: LIST_INCLUDE,
      }),
      prisma.workOrder.findMany({
        where: { ...scope, ...unfinished, dueAt: { lt: now } },
        orderBy: [{ dueAt: 'asc' }, { number: 'asc' }],
        take: 8,
        include: LIST_INCLUDE,
      }),
      prisma.workOrder.findMany({
        where: {
          ...scope,
          status: 'ON_HOLD',
          OR: [{ dueAt: null }, { dueAt: { gte: now } }],
        },
        orderBy: [{ updatedAt: 'asc' }, { number: 'asc' }],
        take: 8,
        include: LIST_INCLUDE,
      }),
    ]);

    const completedPerWeek = [0, 1, 2, 3].map((index) => {
      const start = addDays(firstWeek, index * 7);
      const endDay = addDays(start, 7);
      return {
        weekStart: start,
        count: completed.filter((row) => {
          const day = row.completedAt ? localDay(row.completedAt) : '';
          return day >= start && day < endDay;
        }).length,
      };
    });
    const firstDay = localDay(now);
    const scheduledNext7Days = [0, 1, 2, 3, 4, 5, 6].map((index) => {
      const date = addDays(firstDay, index);
      return {
        date,
        count: scheduledAhead.filter((row) => row.scheduledAt && localDay(row.scheduledAt) === date)
          .length,
      };
    });
    const byType = perType
      .map((group) => {
        const type = types.find((item) => item.id === group.typeId);
        return {
          typeId: group.typeId,
          name: type?.name ?? '—',
          count: group._count._all,
          countsAsPreventive: type?.countsAsPreventive ?? false,
        };
      })
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    const openByPriority = Object.fromEntries(
      WORK_ORDER_PRIORITIES.map((priority) => [
        priority,
        perPriority.find((group) => group.priority === priority)?._count._all ?? 0,
      ]),
    ) as FsmDashboardDto['openByPriority'];
    const teamMembers = caller.can.view
      ? technicians
      : caller.membershipId
        ? [{ membershipId: caller.membershipId, name: caller.name }]
        : [];
    const teamLoad = teamMembers
      .map((member) => ({
        membershipId: member.membershipId,
        name: member.name,
        open:
          perTechnician.find((group) => group.assigneeMembershipId === member.membershipId)?._count
            ._all ?? 0,
        today:
          perTechnicianToday.find((group) => group.assigneeMembershipId === member.membershipId)
            ?._count._all ?? 0,
      }))
      .sort((a, b) => b.open - a.open || a.name.localeCompare(b.name));

    return {
      scope: caller.can.view ? 'all' : 'mine',
      byStatus,
      overdue,
      scheduledToday,
      completedLast30Days,
      upcoming: upcoming.map((row) => toListDto(row, now)),
      recent: recent.map((row) => toListDto(row, now)),
      unassigned,
      overdueUrgent,
      completedPerWeek,
      scheduledNext7Days,
      byType,
      openByPriority,
      teamLoad,
      dispatch: dispatch.map((row) => toListDto(row, now)),
      needsAttention: [...overdueRows, ...onHoldRows].slice(0, 8).map((row) => toListDto(row, now)),
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

  async filterOptions(): Promise<WorkOrderFilterOptionsDto> {
    const [types, branches, technicians] = await Promise.all([
      prisma.workOrderType.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      prisma.branch.findMany({
        select: { id: true, code: true, name: true },
        orderBy: { code: 'asc' },
      }),
      workOrderService.technicians(),
    ]);

    return { types, branches, technicians };
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
          externalReference: input.externalReference || null,
          contactId: input.contactId || null,
          estimatedMinutes: input.estimatedMinutes ? Number(input.estimatedMinutes) : null,
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
          externalReference: input.externalReference || null,
          contactId: input.contactId || null,
          estimatedMinutes: input.estimatedMinutes ? Number(input.estimatedMinutes) : null,
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
