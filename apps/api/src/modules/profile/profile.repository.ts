import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../shared/errors.js';
import { RECORD_NOT_FOUND, isPrismaCode } from '../../shared/prisma-errors.js';

const includePermissions = { permissions: { include: { permission: true } } } as const;

export interface ProfileWriteData {
  name: string;
  description: string | null;
  permissionIds: number[];
}

/**
 * The boundary where Prisma stops — its error codes are translated into
 * domain errors here, same pattern as `person.repository.ts`.
 */
export const profileRepository = {
  findMany() {
    return prisma.accessProfile.findMany({ include: includePermissions, orderBy: { name: 'asc' } });
  },

  findById(id: number) {
    return prisma.accessProfile.findUnique({ where: { id }, include: includePermissions });
  },

  create(data: ProfileWriteData) {
    return prisma.accessProfile.create({
      data: {
        name: data.name,
        description: data.description,
        permissions: { create: data.permissionIds.map((permissionId) => ({ permissionId })) },
      },
      include: includePermissions,
    });
  },

  async update(id: number, data: ProfileWriteData) {
    try {
      // Permission links are re-synced from scratch — simplest correct way
      // to turn "here is the full desired set" into the right set of rows,
      // same approach prisma/seed.ts uses for the profiles it manages.
      return await prisma.$transaction(async (tx) => {
        await tx.profilePermission.deleteMany({ where: { profileId: id } });

        return tx.accessProfile.update({
          where: { id },
          data: {
            name: data.name,
            description: data.description,
            permissions: { create: data.permissionIds.map((permissionId) => ({ permissionId })) },
          },
          include: includePermissions,
        });
      });
    } catch (error) {
      if (isPrismaCode(error, RECORD_NOT_FOUND)) {
        throw new NotFoundError('Profile not found');
      }
      throw error;
    }
  },

  async delete(id: number): Promise<void> {
    try {
      await prisma.accessProfile.delete({ where: { id } });
    } catch (error) {
      if (isPrismaCode(error, RECORD_NOT_FOUND)) {
        throw new NotFoundError('Profile not found');
      }
      throw error;
    }
  },
};
