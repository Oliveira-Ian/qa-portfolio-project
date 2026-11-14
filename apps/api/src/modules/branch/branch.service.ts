import type { BranchDto, BranchWriteInput, FsmListQuery, PaginatedResult } from '@oliveira/schemas';
import type { Prisma } from '../../generated/prisma/client.js';
import { NotFoundError } from '../../shared/errors.js';
import {
  buildFiltersWhere,
  resolveSort,
  toSkipTake,
  type FilterFieldMap,
} from '../../shared/list-query.js';
import { toBranchDto, toBranchWriteData } from './branch.mapper.js';
import { branchRepository } from './branch.repository.js';

const FILTERS: FilterFieldMap = {
  code: { field: 'code', kind: 'text' },
  name: { field: 'name', kind: 'text' },
  document: { field: 'document', kind: 'text' },
  email: { field: 'email', kind: 'text' },
  phone: { field: 'phone', kind: 'text' },
  active: { field: 'active', kind: 'boolean' },
  createdAt: { field: 'createdAt', kind: 'date' },
};

const SORTS: Record<string, string> = {
  code: 'code',
  name: 'name',
  document: 'document',
  active: 'active',
  createdAt: 'createdAt',
};

/** City and state come from the branch's address (`f_city`, `f_state`). */
function addressWhere(raw: Record<string, unknown>): Prisma.BranchWhereInput {
  const conditions: Prisma.AddressWhereInput[] = [];

  for (const field of ['city', 'state'] as const) {
    const value = raw[`f_${field}`];

    if (typeof value === 'string' && value.trim() !== '') {
      conditions.push({ [field]: { contains: value.trim(), mode: 'insensitive' } });
    }
  }

  return conditions.length > 0 ? { addresses: { some: { AND: conditions } } } : {};
}

/** The company's branches as a product manages them (docs/adr/0013, addendum). */
export const branchService = {
  async list(
    query: FsmListQuery,
    raw: Record<string, unknown>,
  ): Promise<PaginatedResult<BranchDto>> {
    const where: Prisma.BranchWhereInput = {
      AND: [
        query.search
          ? {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' } },
                { code: { contains: query.search, mode: 'insensitive' } },
                { addresses: { some: { city: { contains: query.search, mode: 'insensitive' } } } },
              ],
            }
          : {},
        buildFiltersWhere(raw, FILTERS) as Prisma.BranchWhereInput,
        addressWhere(raw),
      ],
    };
    const orderBy = resolveSort(
      query.sortBy,
      query.sortOrder,
      SORTS,
      { code: 'asc' },
      { id: 'asc' },
    ) as Prisma.BranchOrderByWithRelationInput[];
    const { skip, take } = toSkipTake(query);
    const [rows, total] = await Promise.all([
      branchRepository.findPage(where, orderBy, skip, take),
      branchRepository.count(where),
    ]);

    return { items: rows.map(toBranchDto), total, page: query.page, pageSize: query.pageSize };
  },

  /** Every active branch — what a work order's form offers. */
  async options(): Promise<BranchDto[]> {
    return (await branchRepository.findMany({ activeOnly: true })).map(toBranchDto);
  },

  async getById(id: string): Promise<BranchDto> {
    const row = await branchRepository.findById(id);

    if (!row) {
      throw new NotFoundError('Branch not found');
    }

    return toBranchDto(row);
  },

  async create(input: BranchWriteInput): Promise<BranchDto> {
    return toBranchDto(await branchRepository.create(toBranchWriteData(input), input.address));
  },

  async update(id: string, input: BranchWriteInput): Promise<BranchDto> {
    return toBranchDto(await branchRepository.update(id, toBranchWriteData(input), input.address));
  },

  async removeMany(ids: string[]): Promise<void> {
    await branchRepository.deleteMany(ids);
  },
};
