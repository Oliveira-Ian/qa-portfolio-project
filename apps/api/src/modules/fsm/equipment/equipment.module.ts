import type { FastifyInstance } from 'fastify';
import {
  equipmentWriteSchema,
  type EquipmentDto,
  type EquipmentWriteInput,
  type PaginatedResult,
} from '@oliveira/schemas';
import type { Prisma } from '../../../generated/prisma/client.js';
import { prisma, withTransaction, type TransactionClient } from '../../../config/prisma.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../../shared/errors.js';
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
import { toAddressDto } from '../../address/address-sync.js';
import {
  fromDateColumn,
  fsmPlugin,
  orNull,
  registerCrudRoutes,
  toDateColumn,
  type CrudService,
} from '../crud-routes.js';

/**
 * A customer's equipment (plan § 2.9): installed at one of the customer's
 * addresses, with the exact spot ("machine room, 3rd floor"). The address must
 * be the customer's own — checked here, since the database only knows it is
 * the same company's.
 */

const FILTERS: FilterFieldMap = {
  name: { field: 'name', kind: 'text' },
  tag: { field: 'tag', kind: 'text' },
  customer: { field: 'customer.person.name', kind: 'text' },
  category: { field: 'category', kind: 'text' },
  manufacturer: { field: 'manufacturer', kind: 'text' },
  model: { field: 'model', kind: 'text' },
  serialNumber: { field: 'serialNumber', kind: 'text' },
  status: { field: 'status', kind: 'enumScalar' },
  warrantyUntil: { field: 'warrantyUntil', kind: 'date' },
  createdAt: { field: 'createdAt', kind: 'date' },
};

const SORTS: Record<string, string> = {
  name: 'name',
  tag: 'tag',
  customer: 'customer.person.name',
  category: 'category',
  manufacturer: 'manufacturer',
  status: 'status',
  warrantyUntil: 'warrantyUntil',
  createdAt: 'createdAt',
};

const INCLUDE = {
  customer: { include: { person: { select: { name: true } } } },
  address: true,
} satisfies Prisma.EquipmentInclude;

type Row = Prisma.EquipmentGetPayload<{ include: typeof INCLUDE }>;

function toDto(row: Row): EquipmentDto {
  return {
    id: row.id,
    customer: { id: row.customer.id, name: row.customer.person.name },
    address: row.address ? toAddressDto(row.address) : null,
    location: row.location,
    name: row.name,
    tag: row.tag,
    category: row.category,
    manufacturer: row.manufacturer,
    model: row.model,
    serialNumber: row.serialNumber,
    installedAt: fromDateColumn(row.installedAt),
    warrantyUntil: fromDateColumn(row.warrantyUntil),
    status: row.status,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toData(input: EquipmentWriteInput) {
  return {
    customerId: input.customerId,
    addressId: orNull(input.addressId),
    location: orNull(input.location),
    name: input.name,
    tag: orNull(input.tag),
    category: orNull(input.category),
    manufacturer: orNull(input.manufacturer),
    model: orNull(input.model),
    serialNumber: orNull(input.serialNumber),
    installedAt: toDateColumn(input.installedAt),
    warrantyUntil: toDateColumn(input.warrantyUntil),
    status: input.status,
    notes: orNull(input.notes),
  };
}

/** The customer exists in this company, and the address — when given — is one of its own. */
async function checkCustomerAndAddress(
  tx: TransactionClient,
  input: EquipmentWriteInput,
): Promise<void> {
  const customer = await tx.customer.findUnique({ where: { id: input.customerId } });

  if (!customer) {
    throw new BadRequestError('Customer not found');
  }

  if (input.addressId) {
    const address = await tx.address.findUnique({ where: { id: input.addressId } });

    if (!address || address.personId !== customer.personId) {
      throw new BadRequestError("The address must be one of the customer's addresses");
    }
  }
}

function translate(error: unknown): unknown {
  if (isPrismaCode(error, RECORD_NOT_FOUND)) {
    return new NotFoundError('Equipment not found');
  }
  if (isPrismaCode(error, UNIQUE_CONSTRAINT_VIOLATION)) {
    return new ConflictError('An equipment with this tag already exists');
  }
  if (isPrismaCode(error, FOREIGN_KEY_VIOLATION)) {
    return new ConflictError('This equipment has work orders. Deactivate it instead.');
  }

  return error;
}

export const equipmentService: CrudService<EquipmentWriteInput, EquipmentDto> = {
  async list(query, raw): Promise<PaginatedResult<EquipmentDto>> {
    const customerId = typeof raw.customerId === 'string' ? raw.customerId : undefined;
    const where: Prisma.EquipmentWhereInput = {
      AND: [
        customerId ? { customerId } : {},
        query.search
          ? {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' } },
                { tag: { contains: query.search, mode: 'insensitive' } },
                { serialNumber: { contains: query.search, mode: 'insensitive' } },
                {
                  customer: {
                    person: { name: { contains: query.search, mode: 'insensitive' } },
                  },
                },
              ],
            }
          : {},
        buildFiltersWhere(raw, FILTERS) as Prisma.EquipmentWhereInput,
      ],
    };
    const orderBy = resolveSort(
      query.sortBy,
      query.sortOrder,
      SORTS,
      { name: 'asc' },
      { id: 'asc' },
    ) as Prisma.EquipmentOrderByWithRelationInput[];
    const [rows, total] = await Promise.all([
      prisma.equipment.findMany({ where, orderBy, include: INCLUDE, ...toSkipTake(query) }),
      prisma.equipment.count({ where }),
    ]);

    return { items: rows.map(toDto), total, page: query.page, pageSize: query.pageSize };
  },

  async getById(id) {
    const row = await prisma.equipment.findUnique({ where: { id }, include: INCLUDE });

    if (!row) {
      throw new NotFoundError('Equipment not found');
    }

    return toDto(row);
  },

  async create(input) {
    try {
      return await withTransaction(async (tx) => {
        await checkCustomerAndAddress(tx, input);

        return toDto(
          await tx.equipment.create({
            data: { ...toData(input), companyId: requireCompanyId() },
            include: INCLUDE,
          }),
        );
      });
    } catch (error) {
      throw translate(error);
    }
  },

  async update(id, input) {
    try {
      return await withTransaction(async (tx) => {
        await checkCustomerAndAddress(tx, input);

        return toDto(
          await tx.equipment.update({ where: { id }, data: toData(input), include: INCLUDE }),
        );
      });
    } catch (error) {
      throw translate(error);
    }
  },

  async removeMany(ids) {
    try {
      await withTransaction(async (tx) => {
        for (const id of ids) {
          await tx.equipment.delete({ where: { id } });
        }
      });
    } catch (error) {
      throw translate(error);
    }
  },
};

export async function equipmentRoutes(app: FastifyInstance) {
  fsmPlugin(app);

  registerCrudRoutes(app, {
    tag: 'equipment',
    service: equipmentService,
    writeSchema: equipmentWriteSchema,
    guards: {
      // Whoever opens or edits a work order picks the customer's equipment.
      read: requireAnyOf(
        requirePermission('FSM', 'equipment:view'),
        requirePermission('FSM', 'work-order:create'),
        requirePermission('FSM', 'work-order:edit'),
      ),
      create: requirePermission('FSM', 'equipment:create'),
      edit: requirePermission('FSM', 'equipment:edit'),
      delete: requirePermission('FSM', 'equipment:delete'),
    },
    deletedMessage: (count) => (count === 1 ? 'Equipment deleted' : `${count} equipment deleted`),
  });
}
