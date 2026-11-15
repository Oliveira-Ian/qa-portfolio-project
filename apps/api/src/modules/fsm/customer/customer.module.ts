import type { FastifyInstance, FastifyRequest } from 'fastify';
import {
  customerPersonWriteSchema,
  type CustomerDto,
  type CustomerOptionDto,
  type CustomerPersonWriteInput,
  type PaginatedResult,
} from '@oliveira/schemas';
import type { Prisma } from '../../../generated/prisma/client.js';
import { prisma, withTransaction, type TransactionClient } from '../../../config/prisma.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../../shared/errors.js';
import { sendSuccess } from '../../../shared/http.js';
import {
  buildFiltersWhere,
  readListParam,
  resolveSort,
  toSkipTake,
  type FilterFieldMap,
} from '../../../shared/list-query.js';
import {
  FOREIGN_KEY_VIOLATION,
  RECORD_NOT_FOUND,
  UNIQUE_CONSTRAINT_VIOLATION,
  isPrismaCode,
} from '../../../shared/prisma-errors.js';
import { requireCompanyId } from '../../../shared/request-context.js';
import { requireAnyOf, requirePermission } from '../../auth/authorize.js';
import {
  ADDRESS_ORDER,
  CONTACT_ORDER,
  syncAddresses,
  syncContacts,
  toAddressDto,
} from '../../address/address-sync.js';
import { toPersonDto, toPersonWriteData } from '../../person/person.mapper.js';
import { FULL_RECORD, PRIMARY_ADDRESS } from '../../person/person.repository.js';
import { fsmPlugin, registerCrudRoutes, type CrudService } from '../crud-routes.js';

/**
 * Customers of Oliveira FSM (plan § 2.5, docs/adr/0019): a Customer row over a
 * Person of the company. Creating one writes the person — with its addresses
 * and contacts — and the customer in one transaction; editing one edits the
 * person. The FSM never sets the ERP's `Person.types`: a new person starts
 * with none, and an existing one keeps whatever the ERP gave it.
 */

const FILTERS: FilterFieldMap = {
  // Picked in a searchable multi-select: the customers themselves, by id.
  name: { field: 'id', kind: 'enumScalar' },
  tradeName: { field: 'person.tradeName', kind: 'text' },
  document: { field: 'person.document', kind: 'text' },
  email: { field: 'person.email', kind: 'text' },
  phone: { field: 'person.phone', kind: 'text' },
  active: { field: 'person.active', kind: 'boolean' },
  createdAt: { field: 'createdAt', kind: 'date' },
};

const SORTS: Record<string, string> = {
  name: 'person.name',
  document: 'person.document',
  email: 'person.email',
  phone: 'person.phone',
  active: 'person.active',
  createdAt: 'createdAt',
};

const BRANCH = { select: { id: true, code: true, name: true } } as const;

const LIST_INCLUDE = {
  person: { include: PRIMARY_ADDRESS },
  defaultBranch: BRANCH,
  _count: { select: { equipment: true, workOrders: true } },
} satisfies Prisma.CustomerInclude;

const RECORD_INCLUDE = {
  person: { include: FULL_RECORD },
  defaultBranch: BRANCH,
  _count: { select: { equipment: true, workOrders: true } },
} satisfies Prisma.CustomerInclude;

type Reader = Pick<TransactionClient, 'workOrder'>;
interface OpenCounts {
  open: number;
  overdue: number;
}

const UNFINISHED = { notIn: ['COMPLETED', 'CANCELLED'] } as {
  notIn: ('COMPLETED' | 'CANCELLED')[];
};

/** Unfinished work orders per customer, and how many of them are past due — for a page at once. */
async function loadOpenCounts(client: Reader, ids: string[]): Promise<Map<string, OpenCounts>> {
  if (ids.length === 0) {
    return new Map();
  }
  const [open, overdue] = await Promise.all([
    client.workOrder.groupBy({
      by: ['customerId'],
      where: { customerId: { in: ids }, status: UNFINISHED },
      _count: { _all: true },
    }),
    client.workOrder.groupBy({
      by: ['customerId'],
      where: { customerId: { in: ids }, status: UNFINISHED, dueAt: { lt: new Date() } },
      _count: { _all: true },
    }),
  ]);

  return new Map(
    ids.map((id) => [
      id,
      {
        open: open.find((row) => row.customerId === id)?._count._all ?? 0,
        overdue: overdue.find((row) => row.customerId === id)?._count._all ?? 0,
      },
    ]),
  );
}

type ListRow = Prisma.CustomerGetPayload<{ include: typeof LIST_INCLUDE }>;
type RecordRow = Prisma.CustomerGetPayload<{ include: typeof RECORD_INCLUDE }>;

function toDto(
  row: ListRow | RecordRow,
  withLists: boolean,
  counts: OpenCounts = { open: 0, overdue: 0 },
): CustomerDto {
  return {
    id: row.id,
    person: toPersonDto(row.person, withLists),
    equipmentCount: row._count.equipment,
    serviceInstructions: row.serviceInstructions,
    defaultBranch: row.defaultBranch,
    openWorkOrderCount: counts.open,
    overdueWorkOrderCount: counts.overdue,
    workOrderCount: row._count.workOrders,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** The person's columns of a customer's write — without `types`, which only the ERP sets. */
function personData(input: CustomerPersonWriteInput) {
  // The mapper picks the person's columns one by one, so the customer's own fields stay out.
  const data: Partial<ReturnType<typeof toPersonWriteData>> = toPersonWriteData({
    ...input,
    types: [],
  });
  delete data.types;

  return data as Omit<ReturnType<typeof toPersonWriteData>, 'types'>;
}

/** What the FSM keeps on the customer itself; the branch must be the company's. */
async function customerData(tx: TransactionClient, input: CustomerPersonWriteInput) {
  const defaultBranchId = input.defaultBranchId?.trim() || null;

  if (defaultBranchId && !(await tx.branch.findUnique({ where: { id: defaultBranchId } }))) {
    throw new BadRequestError('Branch not found');
  }

  return {
    serviceInstructions: input.serviceInstructions?.trim() || null,
    defaultBranchId,
  };
}

/**
 * City and state of the primary address, matched in the address table: the
 * cities picked in a multi-select (`f_city=Campinas,São Paulo`), the state typed.
 */
function primaryAddressWhere(raw: Record<string, unknown>): Prisma.CustomerWhereInput {
  const conditions: Prisma.AddressWhereInput[] = [];
  const cities = readListParam(raw, 'f_city');
  const state = raw.f_state;

  if (cities) {
    conditions.push({ city: { in: cities } });
  }
  if (typeof state === 'string' && state.trim() !== '') {
    conditions.push({ state: { contains: state.trim(), mode: 'insensitive' } });
  }

  return conditions.length > 0
    ? { person: { addresses: { some: { isPrimary: true, AND: conditions } } } }
    : {};
}

function translate(error: unknown, operation: 'write' | 'delete' = 'delete'): unknown {
  if (isPrismaCode(error, RECORD_NOT_FOUND)) {
    return new NotFoundError('Customer not found');
  }
  if (isPrismaCode(error, UNIQUE_CONSTRAINT_VIOLATION)) {
    return new ConflictError('A person with this document already exists');
  }
  if (isPrismaCode(error, FOREIGN_KEY_VIOLATION)) {
    return new ConflictError(
      operation === 'write'
        ? 'An address in use by equipment or work orders cannot be removed'
        : 'This customer has equipment or work orders. Deactivate it instead.',
    );
  }

  return error;
}

/** What `/options` is asked for: a search, one chosen customer, or several by id. */
interface CustomerOptionsQuery {
  search?: string | undefined;
  id?: string | undefined;
  /** Several by id, active or not — the labels of a filter's chosen customers. */
  ids?: string[] | undefined;
  /** A filter searches every customer, not only the active ones a form may pick. */
  includeInactive?: boolean;
}

export const customerService: CrudService<CustomerPersonWriteInput, CustomerDto> & {
  options(query?: CustomerOptionsQuery): Promise<CustomerOptionDto[]>;
  cities(): Promise<string[]>;
} = {
  async list(query, raw): Promise<PaginatedResult<CustomerDto>> {
    const where: Prisma.CustomerWhereInput = {
      AND: [
        query.search
          ? {
              person: {
                OR: [
                  { name: { contains: query.search, mode: 'insensitive' } },
                  { tradeName: { contains: query.search, mode: 'insensitive' } },
                  { document: { contains: query.search } },
                ],
              },
            }
          : {},
        buildFiltersWhere(raw, FILTERS) as Prisma.CustomerWhereInput,
        primaryAddressWhere(raw),
      ],
    };
    const orderBy = resolveSort(
      query.sortBy,
      query.sortOrder,
      SORTS,
      { person: { name: 'asc' } },
      { id: 'asc' },
    ) as Prisma.CustomerOrderByWithRelationInput[];
    const [rows, total] = await Promise.all([
      prisma.customer.findMany({ where, orderBy, include: LIST_INCLUDE, ...toSkipTake(query) }),
      prisma.customer.count({ where }),
    ]);

    const counts = await loadOpenCounts(
      prisma,
      rows.map((row) => row.id),
    );

    return {
      items: rows.map((row) => toDto(row, false, counts.get(row.id))),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  },

  async getById(id) {
    const row = await prisma.customer.findUnique({ where: { id }, include: RECORD_INCLUDE });

    if (!row) {
      throw new NotFoundError('Customer not found');
    }

    return toDto(row, true, (await loadOpenCounts(prisma, [id])).get(id));
  },

  async create(input) {
    try {
      return await withTransaction(async (tx) => {
        const companyId = requireCompanyId();
        const person = await tx.person.create({
          data: { ...personData(input), types: [], companyId },
        });

        await syncAddresses(tx, companyId, { personId: person.id }, input.addresses);
        await syncContacts(tx, companyId, person.id, input.contacts);

        const customer = await tx.customer.create({
          data: { companyId, personId: person.id, ...(await customerData(tx, input)) },
        });

        return toDto(
          await tx.customer.findUniqueOrThrow({
            where: { id: customer.id },
            include: RECORD_INCLUDE,
          }),
          true,
        );
      });
    } catch (error) {
      throw translate(error, 'write');
    }
  },

  async update(id, input) {
    try {
      return await withTransaction(async (tx) => {
        const companyId = requireCompanyId();
        const { personId } = await tx.customer.findUniqueOrThrow({ where: { id } });

        await tx.person.update({ where: { id: personId }, data: personData(input) });
        await syncAddresses(tx, companyId, { personId }, input.addresses);
        await syncContacts(tx, companyId, personId, input.contacts);
        await tx.customer.update({
          where: { id },
          data: { updatedAt: new Date(), ...(await customerData(tx, input)) },
        });

        return toDto(
          await tx.customer.findUniqueOrThrow({ where: { id }, include: RECORD_INCLUDE }),
          true,
          (await loadOpenCounts(tx, [id])).get(id),
        );
      });
    } catch (error) {
      throw translate(error, 'write');
    }
  },

  /**
   * Removes the customers from the FSM. A person the FSM created — no ERP
   * type, no member linked to it — goes with it; one the ERP also uses stays
   * in the company's registry.
   */
  async removeMany(ids) {
    try {
      await withTransaction(async (tx) => {
        for (const id of ids) {
          const customer = await tx.customer.delete({
            where: { id },
            include: { person: { include: { _count: { select: { memberships: true } } } } },
          });

          if (customer.person.types.length === 0 && customer.person._count.memberships === 0) {
            await tx.person.delete({ where: { id: customer.personId } });
          }
        }
      });
    } catch (error) {
      throw translate(error);
    }
  },

  /**
   * Active customers matching `search`, with their addresses — what another
   * record's form offers; or, by `id`/`ids`, the ones already chosen (active or not).
   */
  async options({ search, id, ids, includeInactive = false } = {}) {
    const byId = id !== undefined || ids !== undefined;
    const rows = await prisma.customer.findMany({
      where: {
        ...(id ? { id } : {}),
        ...(ids ? { id: { in: ids } } : {}),
        person: {
          ...(byId || includeInactive ? {} : { active: true }),
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { tradeName: { contains: search, mode: 'insensitive' } },
                  { document: { contains: search } },
                ],
              }
            : {}),
        },
      },
      orderBy: [{ person: { name: 'asc' } }, { id: 'asc' }],
      take: ids ? ids.length : 20,
      include: {
        person: {
          include: { addresses: { orderBy: ADDRESS_ORDER }, contacts: { orderBy: CONTACT_ORDER } },
        },
      },
    });
    const counts = await loadOpenCounts(
      prisma,
      rows.map((row) => row.id),
    );

    return rows.map((row) => ({
      id: row.id,
      name: row.person.name,
      document: row.person.document,
      addresses: row.person.addresses.map(toAddressDto),
      contacts: row.person.contacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        role: contact.role,
        phone: contact.phone,
        mobile: contact.mobile,
        isPrimary: contact.isPrimary,
      })),
      serviceInstructions: row.serviceInstructions,
      defaultBranchId: row.defaultBranchId,
      openWorkOrderCount: counts.get(row.id)?.open ?? 0,
    }));
  },

  /** The cities of the customers' primary addresses, to filter the list by. */
  async cities() {
    const rows = await prisma.address.findMany({
      where: { isPrimary: true, city: { not: null }, person: { customer: { isNot: null } } },
      distinct: ['city'],
      select: { city: true },
      orderBy: { city: 'asc' },
    });

    return rows.flatMap((row) => (row.city ? [row.city] : []));
  },
};

export async function customerRoutes(app: FastifyInstance) {
  fsmPlugin(app);

  const view = requirePermission('FSM', 'customer:view');

  // Before `/:id`: the options another form offers (equipment, work orders).
  app.get(
    '/options',
    {
      preHandler: requireAnyOf(
        view,
        requirePermission('FSM', 'equipment:create'),
        requirePermission('FSM', 'equipment:edit'),
        requirePermission('FSM', 'work-order:create'),
        requirePermission('FSM', 'work-order:edit'),
      ),
      schema: { tags: ['customers'], security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to list customers' },
    },
    async (request: FastifyRequest, reply) => {
      const query = request.query as Record<string, unknown>;
      const search =
        typeof query.search === 'string' && query.search.trim() ? query.search.trim() : undefined;
      const id = typeof query.id === 'string' && query.id ? query.id : undefined;

      return sendSuccess(
        reply,
        200,
        await customerService.options({
          search,
          id,
          ids: readListParam(query, 'ids'),
          includeInactive: query.all === 'true',
        }),
      );
    },
  );

  app.get(
    '/cities',
    {
      preHandler: view,
      schema: { tags: ['customers'], security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to list the customers’ cities' },
    },
    async (_request, reply) => sendSuccess(reply, 200, await customerService.cities()),
  );

  registerCrudRoutes(app, {
    tag: 'customers',
    service: customerService,
    writeSchema: customerPersonWriteSchema,
    guards: {
      read: view,
      create: requirePermission('FSM', 'customer:create'),
      edit: requirePermission('FSM', 'customer:edit'),
      delete: requirePermission('FSM', 'customer:delete'),
    },
    deletedMessage: (count) => (count === 1 ? 'Customer deleted' : `${count} customers deleted`),
  });
}
