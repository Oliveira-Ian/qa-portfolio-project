import type { FastifyInstance, FastifyRequest } from 'fastify';
import {
  customerPersonWriteSchema,
  type CustomerDto,
  type CustomerOptionDto,
  type CustomerPersonWriteInput,
  type PaginatedResult,
} from '@oliveira/schemas';
import type { Prisma } from '../../../generated/prisma/client.js';
import { prisma, withTransaction } from '../../../config/prisma.js';
import { ConflictError, NotFoundError } from '../../../shared/errors.js';
import { sendSuccess } from '../../../shared/http.js';
import {
  buildFiltersWhere,
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
  name: { field: 'person.name', kind: 'text' },
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

const LIST_INCLUDE = {
  person: { include: PRIMARY_ADDRESS },
  _count: { select: { equipment: true } },
} satisfies Prisma.CustomerInclude;

const RECORD_INCLUDE = {
  person: { include: FULL_RECORD },
  _count: { select: { equipment: true } },
} satisfies Prisma.CustomerInclude;

type ListRow = Prisma.CustomerGetPayload<{ include: typeof LIST_INCLUDE }>;
type RecordRow = Prisma.CustomerGetPayload<{ include: typeof RECORD_INCLUDE }>;

function toDto(row: ListRow | RecordRow, withLists: boolean): CustomerDto {
  return {
    id: row.id,
    person: toPersonDto(row.person, withLists),
    equipmentCount: row._count.equipment,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** The person's columns of a customer's write — without `types`, which only the ERP sets. */
function personData(input: CustomerPersonWriteInput) {
  const data: Partial<ReturnType<typeof toPersonWriteData>> = toPersonWriteData({
    ...input,
    types: [],
  });
  delete data.types;

  return data as Omit<ReturnType<typeof toPersonWriteData>, 'types'>;
}

/** City and state of the primary address, matched in the address table (`f_city`, `f_state`). */
function primaryAddressWhere(raw: Record<string, unknown>): Prisma.CustomerWhereInput {
  const conditions: Prisma.AddressWhereInput[] = [];

  for (const field of ['city', 'state'] as const) {
    const value = raw[`f_${field}`];

    if (typeof value === 'string' && value.trim() !== '') {
      conditions.push({ [field]: { contains: value.trim(), mode: 'insensitive' } });
    }
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

export const customerService: CrudService<CustomerPersonWriteInput, CustomerDto> & {
  options(search: string | undefined, id?: string): Promise<CustomerOptionDto[]>;
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

    return {
      items: rows.map((row) => toDto(row, false)),
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

    return toDto(row, true);
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

        const customer = await tx.customer.create({ data: { companyId, personId: person.id } });

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
        await tx.customer.update({ where: { id }, data: { updatedAt: new Date() } });

        return toDto(
          await tx.customer.findUniqueOrThrow({ where: { id }, include: RECORD_INCLUDE }),
          true,
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
   * record's form offers; or, by `id`, the one already chosen (active or not).
   */
  async options(search, id) {
    const rows = await prisma.customer.findMany({
      where: {
        ...(id ? { id } : {}),
        person: {
          ...(id ? {} : { active: true }),
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
      take: 20,
      include: { person: { include: { addresses: { orderBy: ADDRESS_ORDER } } } },
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.person.name,
      document: row.person.document,
      addresses: row.person.addresses.map(toAddressDto),
    }));
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
      const query = request.query as { search?: unknown; id?: unknown };
      const search =
        typeof query.search === 'string' && query.search.trim() ? query.search.trim() : undefined;
      const id = typeof query.id === 'string' && query.id ? query.id : undefined;

      return sendSuccess(reply, 200, await customerService.options(search, id));
    },
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
