import type { AddressWriteInput } from '@oliveira/schemas';
import type { Address, Branch, Prisma } from '../../generated/prisma/client.js';
import { prisma, withTransaction } from '../../config/prisma.js';
import { ConflictError, NotFoundError } from '../../shared/errors.js';
import {
  FOREIGN_KEY_VIOLATION,
  RECORD_NOT_FOUND,
  UNIQUE_CONSTRAINT_VIOLATION,
  isPrismaCode,
} from '../../shared/prisma-errors.js';
import { requireCompanyId } from '../../shared/request-context.js';
import { ADDRESS_ORDER, syncAddresses } from '../address/address-sync.js';

export interface BranchWriteData {
  code: string;
  name: string;
  document: string | null;
  stateRegistration: string | null;
  email: string | null;
  phone: string | null;
  active: boolean;
}

export type BranchRow = Branch & { addresses: Address[] };

const WITH_ADDRESS = {
  addresses: { orderBy: ADDRESS_ORDER, take: 1 },
} satisfies Prisma.BranchInclude;

/** The code is unique within the company; a branch something points at can't be deleted. */
function translateWriteError(error: unknown): unknown {
  if (isPrismaCode(error, RECORD_NOT_FOUND)) {
    return new NotFoundError('Branch not found');
  }
  if (isPrismaCode(error, UNIQUE_CONSTRAINT_VIOLATION)) {
    return new ConflictError('A branch with this code already exists');
  }
  if (isPrismaCode(error, FOREIGN_KEY_VIOLATION)) {
    return new ConflictError('This branch is in use. Deactivate it instead.');
  }

  return error;
}

/**
 * The caller's company's branches — scoped by the Prisma client and enforced by
 * row-level security (docs/adr/0012); another company's id reads as not found.
 * A branch keeps one address (`Address`, the registry's shared table).
 */
export const branchRepository = {
  findMany(options: { search?: string; activeOnly?: boolean } = {}): Promise<BranchRow[]> {
    const { search, activeOnly = false } = options;

    return prisma.branch.findMany({
      where: {
        ...(activeOnly ? { active: true } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { addresses: { some: { city: { contains: search, mode: 'insensitive' } } } },
              ],
            }
          : {}),
      },
      orderBy: [{ active: 'desc' }, { name: 'asc' }, { id: 'asc' }],
      include: WITH_ADDRESS,
    });
  },

  findPage(
    where: Prisma.BranchWhereInput,
    orderBy: Prisma.BranchOrderByWithRelationInput[],
    skip: number,
    take: number,
  ): Promise<BranchRow[]> {
    return prisma.branch.findMany({ where, orderBy, skip, take, include: WITH_ADDRESS });
  },

  count(where: Prisma.BranchWhereInput): Promise<number> {
    return prisma.branch.count({ where });
  },

  findById(id: string): Promise<BranchRow | null> {
    return prisma.branch.findUnique({ where: { id }, include: WITH_ADDRESS });
  },

  async create(data: BranchWriteData, address: AddressWriteInput): Promise<BranchRow> {
    try {
      return await withTransaction(async (tx) => {
        const companyId = requireCompanyId();
        const branch = await tx.branch.create({ data: { ...data, companyId } });

        await syncAddresses(tx, companyId, { branchId: branch.id }, addressList(address));

        return tx.branch.findUniqueOrThrow({ where: { id: branch.id }, include: WITH_ADDRESS });
      });
    } catch (error) {
      throw translateWriteError(error);
    }
  },

  async update(id: string, data: BranchWriteData, address: AddressWriteInput): Promise<BranchRow> {
    try {
      return await withTransaction(async (tx) => {
        await tx.branch.update({ where: { id }, data });
        await syncAddresses(tx, requireCompanyId(), { branchId: id }, addressList(address));

        return tx.branch.findUniqueOrThrow({ where: { id }, include: WITH_ADDRESS });
      });
    } catch (error) {
      throw translateWriteError(error);
    }
  },

  /** All or nothing: one branch in use and none is deleted. */
  async deleteMany(ids: string[]): Promise<void> {
    try {
      await withTransaction(async (tx) => {
        for (const id of ids) {
          await tx.branch.delete({ where: { id } });
        }
      });
    } catch (error) {
      throw translateWriteError(error);
    }
  },
};

/** An address with nothing typed in it is no address: the branch is saved without one. */
function addressList(address: AddressWriteInput): AddressWriteInput[] {
  const { street, number, district, city, state, zipCode, complement, reference } = address;
  const isEmpty = [street, number, district, city, state, zipCode, complement, reference].every(
    (value) => value.trim() === '',
  );

  return isEmpty ? [] : [{ ...address, isPrimary: true }];
}
