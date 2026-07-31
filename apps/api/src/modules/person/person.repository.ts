import type { Person as PersonRow, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../shared/errors.js';
import { RECORD_NOT_FOUND, isPrismaCode } from '../../shared/prisma-errors.js';

/**
 * The boundary where Prisma stops. Its error codes are translated into domain
 * errors here so nothing above has to know what `P2025` means — that's what
 * used to make `PUT`/`DELETE` on an unknown id answer 500 instead of 404.
 */
export const personRepository = {
  findMany(where: Prisma.PersonWhereInput): Promise<PersonRow[]> {
    return prisma.person.findMany({ where, orderBy: { createdAt: 'desc' } });
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
      throw error;
    }
  },
};
