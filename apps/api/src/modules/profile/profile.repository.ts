import type { Prisma } from '@prisma/client';
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
 *
 * `skip`/`take` are optional — `profile.service.ts`'s `permissionCount`
 * fallback path fetches every `where`-matched row (no `take`) to filter/sort
 * on that computed value in memory, rather than slicing at the database.
 */
export const profileRepository = {
  findMany(
    where: Prisma.AccessProfileWhereInput,
    orderBy: Prisma.AccessProfileOrderByWithRelationInput[],
    skip?: number,
    take?: number,
  ) {
    return prisma.accessProfile.findMany({
      where,
      orderBy,
      include: includePermissions,
      ...(skip === undefined ? {} : { skip }),
      ...(take === undefined ? {} : { take }),
    });
  },

  count(where: Prisma.AccessProfileWhereInput): Promise<number> {
    return prisma.accessProfile.count({ where });
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
