import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../shared/errors.js';
import {
  FOREIGN_KEY_VIOLATION,
  RECORD_NOT_FOUND,
  UNIQUE_CONSTRAINT_VIOLATION,
  isPrismaCode,
} from '../../shared/prisma-errors.js';
import { withProfileManagerGuard } from '../company/company-guards.js';

const includePermissions = { permissions: { include: { permission: true } } } as const;

export interface ProfileWriteData {
  name: string;
  description: string | null;
  permissionIds: number[];
}

/**
 * What a failed create/update means to a caller. The name is the profile's only
 * unique column (the service drops repeated permission ids, so the
 * `(profile, permission)` key cannot collide), and the one foreign key a write
 * can break is a permission id that does not exist. Anything else is unexpected
 * and keeps propagating as a 500.
 */
function translateWriteError(error: unknown): unknown {
  if (isPrismaCode(error, RECORD_NOT_FOUND)) {
    return new NotFoundError('Profile not found');
  }
  if (isPrismaCode(error, UNIQUE_CONSTRAINT_VIOLATION)) {
    return new ConflictError('A profile with this name already exists');
  }
  if (isPrismaCode(error, FOREIGN_KEY_VIOLATION)) {
    return new BadRequestError('One or more permissions do not exist');
  }

  return error;
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

  async create(data: ProfileWriteData) {
    try {
      return await prisma.accessProfile.create({
        data: {
          name: data.name,
          description: data.description,
          permissions: { create: data.permissionIds.map((permissionId) => ({ permissionId })) },
        },
        include: includePermissions,
      });
    } catch (error) {
      throw translateWriteError(error);
    }
  },

  async update(id: number, data: ProfileWriteData) {
    try {
      // Permission links are re-synced from scratch — simplest correct way
      // to turn "here is the full desired set" into the right set of rows,
      // same approach prisma/seed.ts uses for the profiles it manages. Guarded:
      // dropping `profile:manage` from the last profile that carries it would
      // leave the company with no one able to manage profiles (409).
      return await withProfileManagerGuard(async (tx) => {
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
      throw translateWriteError(error);
    }
  },

  async delete(id: number): Promise<void> {
    try {
      await withProfileManagerGuard((tx) => tx.accessProfile.delete({ where: { id } }));
    } catch (error) {
      if (isPrismaCode(error, RECORD_NOT_FOUND)) {
        throw new NotFoundError('Profile not found');
      }
      throw error;
    }
  },
};
