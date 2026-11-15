import type { FastifyInstance } from 'fastify';
import {
  catalogItemWriteSchema,
  type CatalogItemDto,
  type CatalogItemWriteInput,
  type PaginatedResult,
} from '@oliveira/schemas';
import type { CatalogItem, Prisma } from '../../../generated/prisma/client.js';
import { prisma, withTransaction } from '../../../config/prisma.js';
import { ConflictError, NotFoundError } from '../../../shared/errors.js';
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
import { fsmPlugin, orNull, registerCrudRoutes, type CrudService } from '../crud-routes.js';

/**
 * Products and services (plan § 2.5): what a work order records as materials
 * used and services performed. No stock balance in the V1 — a product used is
 * recorded, not deducted.
 */

const FILTERS: FilterFieldMap = {
  kind: { field: 'kind', kind: 'enumScalar' },
  code: { field: 'code', kind: 'text' },
  name: { field: 'name', kind: 'text' },
  unit: { field: 'unit', kind: 'text' },
  active: { field: 'active', kind: 'boolean' },
  createdAt: { field: 'createdAt', kind: 'date' },
};

const SORTS: Record<string, string> = {
  kind: 'kind',
  code: 'code',
  name: 'name',
  unit: 'unit',
  price: 'price',
  active: 'active',
  createdAt: 'createdAt',
};

function toDto(row: CatalogItem): CatalogItemDto {
  return {
    id: row.id,
    kind: row.kind,
    code: row.code,
    name: row.name,
    description: row.description,
    unit: row.unit,
    price: row.price === null ? null : row.price.toFixed(2),
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toData(input: CatalogItemWriteInput) {
  return {
    kind: input.kind,
    code: orNull(input.code),
    name: input.name,
    description: orNull(input.description),
    unit: input.unit.toUpperCase(),
    price: input.price === '' ? null : input.price,
    active: input.active,
  };
}

function translate(error: unknown): unknown {
  if (isPrismaCode(error, RECORD_NOT_FOUND)) {
    return new NotFoundError('Product or service not found');
  }
  if (isPrismaCode(error, UNIQUE_CONSTRAINT_VIOLATION)) {
    return new ConflictError('A product or service with this code already exists');
  }
  if (isPrismaCode(error, FOREIGN_KEY_VIOLATION)) {
    return new ConflictError('This product or service is in use. Deactivate it instead.');
  }

  return error;
}

export const catalogItemService: CrudService<CatalogItemWriteInput, CatalogItemDto> = {
  async list(query, raw): Promise<PaginatedResult<CatalogItemDto>> {
    const where: Prisma.CatalogItemWhereInput = {
      AND: [
        query.search
          ? {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' } },
                { code: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {},
        buildFiltersWhere(raw, FILTERS) as Prisma.CatalogItemWhereInput,
      ],
    };
    const orderBy = resolveSort(
      query.sortBy,
      query.sortOrder,
      SORTS,
      { name: 'asc' },
      { id: 'asc' },
    ) as Prisma.CatalogItemOrderByWithRelationInput[];
    const [rows, total] = await Promise.all([
      prisma.catalogItem.findMany({ where, orderBy, ...toSkipTake(query) }),
      prisma.catalogItem.count({ where }),
    ]);

    return { items: rows.map(toDto), total, page: query.page, pageSize: query.pageSize };
  },

  async getById(id) {
    const row = await prisma.catalogItem.findUnique({ where: { id } });

    if (!row) {
      throw new NotFoundError('Product or service not found');
    }

    return toDto(row);
  },

  async create(input) {
    try {
      return toDto(
        await prisma.catalogItem.create({
          data: { ...toData(input), companyId: requireCompanyId() },
        }),
      );
    } catch (error) {
      throw translate(error);
    }
  },

  async update(id, input) {
    try {
      return toDto(await prisma.catalogItem.update({ where: { id }, data: toData(input) }));
    } catch (error) {
      throw translate(error);
    }
  },

  async removeMany(ids) {
    try {
      await withTransaction(async (tx) => {
        for (const id of ids) {
          await tx.catalogItem.delete({ where: { id } });
        }
      });
    } catch (error) {
      throw translate(error);
    }
  },
};

export async function catalogItemRoutes(app: FastifyInstance) {
  fsmPlugin(app);

  registerCrudRoutes(app, {
    tag: 'products and services',
    service: catalogItemService,
    writeSchema: catalogItemWriteSchema,
    guards: {
      // A technician recording materials picks them from this list.
      read: requireAnyOf(
        requirePermission('FSM', 'catalog-item:view'),
        requirePermission('FSM', 'work-order:execute'),
        requirePermission('FSM', 'work-order:edit'),
      ),
      create: requirePermission('FSM', 'catalog-item:create'),
      edit: requirePermission('FSM', 'catalog-item:edit'),
      delete: requirePermission('FSM', 'catalog-item:delete'),
    },
    deletedMessage: (count) =>
      count === 1 ? 'Product or service deleted' : `${count} products and services deleted`,
  });
}
