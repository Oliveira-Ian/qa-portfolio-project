import type { FastifyInstance } from 'fastify';
import {
  workOrderTypeWriteSchema,
  type PaginatedResult,
  type WorkOrderTypeDto,
  type WorkOrderTypeWriteInput,
} from '@oliveira/schemas';
import type { Prisma, WorkOrderType } from '../../../generated/prisma/client.js';
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
 * Work order types (plan § 2.5): a short list each company keeps — the
 * reference ones are copied in when it contracts the FSM. Small enough to
 * live in one file: mapping, queries and routes.
 */

const FILTERS: FilterFieldMap = {
  name: { field: 'name', kind: 'text' },
  description: { field: 'description', kind: 'text' },
  active: { field: 'active', kind: 'boolean' },
};

const SORTS: Record<string, string> = { name: 'name', active: 'active', createdAt: 'createdAt' };

function toDto(row: WorkOrderType): WorkOrderTypeDto {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toData(input: WorkOrderTypeWriteInput) {
  return { name: input.name, description: orNull(input.description), active: input.active };
}

function translate(error: unknown): unknown {
  if (isPrismaCode(error, RECORD_NOT_FOUND)) {
    return new NotFoundError('Work order type not found');
  }
  if (isPrismaCode(error, UNIQUE_CONSTRAINT_VIOLATION)) {
    return new ConflictError('A work order type with this name already exists');
  }
  if (isPrismaCode(error, FOREIGN_KEY_VIOLATION)) {
    return new ConflictError('This work order type is in use. Deactivate it instead.');
  }

  return error;
}

export const workOrderTypeService: CrudService<WorkOrderTypeWriteInput, WorkOrderTypeDto> = {
  async list(query, raw): Promise<PaginatedResult<WorkOrderTypeDto>> {
    const where: Prisma.WorkOrderTypeWhereInput = {
      AND: [
        query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {},
        buildFiltersWhere(raw, FILTERS) as Prisma.WorkOrderTypeWhereInput,
      ],
    };
    const orderBy = resolveSort(
      query.sortBy,
      query.sortOrder,
      SORTS,
      { name: 'asc' },
      { id: 'asc' },
    ) as Prisma.WorkOrderTypeOrderByWithRelationInput[];
    const [rows, total] = await Promise.all([
      prisma.workOrderType.findMany({ where, orderBy, ...toSkipTake(query) }),
      prisma.workOrderType.count({ where }),
    ]);

    return { items: rows.map(toDto), total, page: query.page, pageSize: query.pageSize };
  },

  async getById(id) {
    const row = await prisma.workOrderType.findUnique({ where: { id } });

    if (!row) {
      throw new NotFoundError('Work order type not found');
    }

    return toDto(row);
  },

  async create(input) {
    try {
      return toDto(
        await prisma.workOrderType.create({
          data: { ...toData(input), companyId: requireCompanyId() },
        }),
      );
    } catch (error) {
      throw translate(error);
    }
  },

  async update(id, input) {
    try {
      return toDto(await prisma.workOrderType.update({ where: { id }, data: toData(input) }));
    } catch (error) {
      throw translate(error);
    }
  },

  async removeMany(ids) {
    try {
      await withTransaction(async (tx) => {
        for (const id of ids) {
          await tx.workOrderType.delete({ where: { id } });
        }
      });
    } catch (error) {
      throw translate(error);
    }
  },
};

export async function workOrderTypeRoutes(app: FastifyInstance) {
  fsmPlugin(app);

  const manage = requirePermission('FSM', 'work-order-type:manage');

  registerCrudRoutes(app, {
    tag: 'work order types',
    service: workOrderTypeService,
    writeSchema: workOrderTypeWriteSchema,
    guards: {
      // Whoever opens or edits a work order picks its type from this list.
      read: requireAnyOf(
        manage,
        requirePermission('FSM', 'work-order:create'),
        requirePermission('FSM', 'work-order:edit'),
      ),
      create: manage,
      edit: manage,
      delete: manage,
    },
    deletedMessage: (count) =>
      count === 1 ? 'Work order type deleted' : `${count} work order types deleted`,
  });
}
