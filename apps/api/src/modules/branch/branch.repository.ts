import type { Branch } from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import { ConflictError, NotFoundError } from '../../shared/errors.js';
import {
  RECORD_NOT_FOUND,
  UNIQUE_CONSTRAINT_VIOLATION,
  isPrismaCode,
} from '../../shared/prisma-errors.js';
import { requireCompanyId } from '../../shared/request-context.js';

export interface BranchWriteData {
  code: string;
  name: string;
  street: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  active: boolean;
}

/** The only unique column a write can break is the code, within the company. */
function translateWriteError(error: unknown): unknown {
  if (isPrismaCode(error, RECORD_NOT_FOUND)) {
    return new NotFoundError('Branch not found');
  }
  if (isPrismaCode(error, UNIQUE_CONSTRAINT_VIOLATION)) {
    return new ConflictError('A branch with this code already exists');
  }

  return error;
}

/**
 * The caller's company's branches — scoped by the Prisma client and enforced by
 * row-level security (docs/adr/0012); another company's id reads as not found.
 */
export const branchRepository = {
  findMany(search?: string): Promise<Branch[]> {
    return prisma.branch.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
              { city: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {},
      orderBy: [{ active: 'desc' }, { name: 'asc' }, { id: 'asc' }],
    });
  },

  findById(id: string): Promise<Branch | null> {
    return prisma.branch.findUnique({ where: { id } });
  },

  async create(data: BranchWriteData): Promise<Branch> {
    try {
      return await prisma.branch.create({ data: { ...data, companyId: requireCompanyId() } });
    } catch (error) {
      throw translateWriteError(error);
    }
  },

  async update(id: string, data: BranchWriteData): Promise<Branch> {
    try {
      return await prisma.branch.update({ where: { id }, data });
    } catch (error) {
      throw translateWriteError(error);
    }
  },
};
