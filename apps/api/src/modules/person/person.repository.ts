import type { Person as PersonRow, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ConflictError, NotFoundError } from '../../shared/errors.js';
import {
  FOREIGN_KEY_VIOLATION,
  RECORD_NOT_FOUND,
  isPrismaCode,
} from '../../shared/prisma-errors.js';

/**
 * The boundary where Prisma stops. Its error codes are translated into domain
 * errors here so nothing above has to know what `P2025` means — that's what
 * used to make `PUT`/`DELETE` on an unknown id answer 500 instead of 404.
 */
export const personRepository = {
  findMany(
    where: Prisma.PersonWhereInput,
    orderBy: Prisma.PersonOrderByWithRelationInput[],
    skip: number,
    take: number,
  ): Promise<PersonRow[]> {
    return prisma.person.findMany({ where, orderBy, skip, take });
  },

  count(where: Prisma.PersonWhereInput): Promise<number> {
    return prisma.person.count({ where });
  },

  /** Four `COUNT`s and a `LIMIT 5`, in parallel — the whole cost of `/home`'s summary card. */
  async summary(): Promise<{
    total: number;
    clients: number;
    suppliers: number;
    inactive: number;
    recent: PersonRow[];
  }> {
    const [total, clients, suppliers, inactive, recent] = await Promise.all([
      prisma.person.count(),
      prisma.person.count({ where: { types: { has: 'CLIENT' } } }),
      prisma.person.count({ where: { types: { has: 'SUPPLIER' } } }),
      prisma.person.count({ where: { active: false } }),
      prisma.person.findMany({ orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], take: 5 }),
    ]);

    return { total, clients, suppliers, inactive, recent };
  },

  findById(id: string): Promise<PersonRow | null> {
    return prisma.person.findUnique({ where: { id } });
  },

  create(data: Prisma.PersonCreateInput): Promise<PersonRow> {
    return prisma.person.create({ data });
  },

  async update(id: string, data: Prisma.PersonCreateInput): Promise<PersonRow> {
    try {
      return await prisma.person.update({ where: { id }, data });
    } catch (error) {
      if (isPrismaCode(error, RECORD_NOT_FOUND)) {
        throw new NotFoundError('Person not found');
      }
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await prisma.person.delete({ where: { id } });
    } catch (error) {
      if (isPrismaCode(error, RECORD_NOT_FOUND)) {
        throw new NotFoundError('Person not found');
      }
      // AccessAccount.personId is `ON DELETE RESTRICT` on purpose (see
      // prisma/schema.prisma) — silently cascading would destroy a login
      // credential the moment someone deletes the person behind it. The
      // fix here is a clear, actionable 409, not changing the constraint.
      if (isPrismaCode(error, FOREIGN_KEY_VIOLATION)) {
        throw new ConflictError(
          'This person has a linked access account. Remove the access account before deleting this person.',
        );
      }
      throw error;
    }
  },

  /**
   * All-or-nothing: if any id fails (unknown id, or a linked access account),
   * the whole batch rolls back rather than leaving some rows deleted and
   * others not with no way to tell which is which.
   */
  async deleteMany(ids: string[]): Promise<void> {
    try {
      await prisma.$transaction(ids.map((id) => prisma.person.delete({ where: { id } })));
    } catch (error) {
      if (isPrismaCode(error, RECORD_NOT_FOUND)) {
        throw new NotFoundError('One or more people were not found');
      }
      if (isPrismaCode(error, FOREIGN_KEY_VIOLATION)) {
        throw new ConflictError(
          'One or more selected people have a linked access account. Remove the access account before deleting them.',
        );
      }
      throw error;
    }
  },
};
