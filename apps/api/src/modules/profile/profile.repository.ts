import type { Prisma } from '../../generated/prisma/client.js';
import type { Product } from '@oliveira/schemas';
import { prisma } from '../../config/prisma.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../shared/errors.js';
import {
  FOREIGN_KEY_VIOLATION,
  RECORD_NOT_FOUND,
  UNIQUE_CONSTRAINT_VIOLATION,
  isPrismaCode,
} from '../../shared/prisma-errors.js';
import { requireCompanyId } from '../../shared/request-context.js';
import { withProfileManagerGuard } from '../company/company-guards.js';

const includePermissions = { permissions: { include: { permission: true } } } as const;

export interface ProfileWriteData {
  name: string;
  description: string | null;
  permissionIds: number[];
}

/**
 * What a failed create/update means to a caller. The name is unique per company
 * and product (the service drops repeated permission ids, so the
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

function permissionLinks(permissionIds: number[]) {
  // Nested under the profile, each link takes the profile's company and id
  // through their composite relation.
  return { create: permissionIds.map((permissionId) => ({ permissionId })) };
}

/**
 * The boundary where Prisma stops — its error codes are translated into
 * domain errors here, same pattern as `person.repository.ts`.
 *
 * Every query is one product's profiles in the caller's company: the product is
 * an argument, the company is applied by the Prisma client and enforced by
 * row-level security (docs/adr/0012). An FSM profile's id on the ERP's routes
 * reads as "not found", like another company's.
 *
 * `skip`/`take` are optional — `profile.service.ts`'s `permissionCount`
 * fallback path fetches every `where`-matched row (no `take`) to filter/sort
 * on that computed value in memory, rather than slicing at the database.
 */
export const profileRepository = {
  findMany(
    product: Product,
    where: Prisma.AccessProfileWhereInput,
    orderBy: Prisma.AccessProfileOrderByWithRelationInput[],
    skip?: number,
    take?: number,
  ) {
    return prisma.accessProfile.findMany({
      where: { AND: [where, { product }] },
      orderBy,
      include: includePermissions,
      ...(skip === undefined ? {} : { skip }),
      ...(take === undefined ? {} : { take }),
    });
  },

  count(product: Product, where: Prisma.AccessProfileWhereInput): Promise<number> {
    return prisma.accessProfile.count({ where: { AND: [where, { product }] } });
  },

  findById(product: Product, id: number) {
    return prisma.accessProfile.findFirst({ where: { id, product }, include: includePermissions });
  },

  async create(product: Product, data: ProfileWriteData) {
    try {
      return await prisma.accessProfile.create({
        data: {
          companyId: requireCompanyId(),
          product,
          name: data.name,
          description: data.description,
          permissions: permissionLinks(data.permissionIds),
        },
        include: includePermissions,
      });
    } catch (error) {
      throw translateWriteError(error);
    }
  },

  async update(product: Product, id: number, data: ProfileWriteData) {
    try {
      // Permission links are re-synced from scratch — simplest correct way
      // to turn "here is the full desired set" into the right set of rows.
      // Guarded: dropping `profile:manage` from the last profile that carries
      // it would leave the company with no one able to manage this product's
      // profiles (409).
      return await withProfileManagerGuard(product, async (tx) => {
        const current = await tx.accessProfile.findFirst({ where: { id, product } });

        if (!current) {
          throw new NotFoundError('Profile not found');
        }

        await tx.profilePermission.deleteMany({ where: { profileId: id } });

        return tx.accessProfile.update({
          where: { id },
          data: {
            name: data.name,
            description: data.description,
            permissions: permissionLinks(data.permissionIds),
          },
          include: includePermissions,
        });
      });
    } catch (error) {
      throw translateWriteError(error);
    }
  },

  async delete(product: Product, id: number): Promise<void> {
    try {
      await withProfileManagerGuard(product, async (tx) => {
        const { count } = await tx.accessProfile.deleteMany({ where: { id, product } });

        if (count === 0) {
          throw new NotFoundError('Profile not found');
        }
      });
    } catch (error) {
      if (isPrismaCode(error, RECORD_NOT_FOUND)) {
        throw new NotFoundError('Profile not found');
      }
      throw error;
    }
  },

  /** Names already taken in this product, to pick a free one for a copy. */
  async namesStartingWith(product: Product, prefix: string): Promise<string[]> {
    const rows = await prisma.accessProfile.findMany({
      where: { product, name: { startsWith: prefix } },
      select: { name: true },
    });

    return rows.map((row) => row.name);
  },
};
