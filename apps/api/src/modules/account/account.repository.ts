import type { AccessAccount, AccountRole, Prisma } from '../../generated/prisma/client.js';
import type { Product } from '@oliveira/schemas';
import { prisma, withTransaction } from '../../config/prisma.js';
import { ConflictError, NotFoundError } from '../../shared/errors.js';
import {
  RECORD_NOT_FOUND,
  UNIQUE_CONSTRAINT_VIOLATION,
  isPrismaCode,
} from '../../shared/prisma-errors.js';
import { requireCompanyId } from '../../shared/request-context.js';
import { withProfileManagerGuard } from '../company/company-guards.js';

/**
 * An account as a company sees it in one product: its membership in the
 * caller's company (only that one — never another company's), the person it is
 * linked to there, and its profiles of that product.
 */
export type AccountWithProfiles = AccessAccount & {
  memberships: {
    id: string;
    personId: string | null;
    profiles: { profile: { id: number; name: string } }[];
  }[];
};

export interface CreateAccountData {
  name: string;
  email: string;
  passwordHash: string;
}

export interface CreateAccountForPersonData {
  personId: string;
  email: string;
  passwordHash: string;
  /** The company the new login joins, as a plain member. */
  companyId: string;
}

/** The membership in the caller's company and its profiles in `product` — nothing about any other. */
function companyView(product: Product) {
  return {
    memberships: {
      where: { companyId: requireCompanyId() },
      select: {
        id: true,
        personId: true,
        profiles: {
          where: { product },
          select: { profile: { select: { id: true, name: true } } },
        },
      },
    },
  } as const;
}

function targetIncludes(error: unknown, field: string): boolean {
  const target = (error as { meta?: { target?: unknown } }).meta?.target;
  return Array.isArray(target) && target.includes(field);
}

/**
 * The only place in the account module that knows Prisma exists. Everything
 * above it works with plain objects, which is what makes the service testable
 * without a database.
 */
export const accountRepository = {
  /** Read before any company is known (sign-in, `requireAuth`): the global identity only. */
  findByEmail(email: string): Promise<AccessAccount | null> {
    return prisma.accessAccount.findUnique({ where: { email } });
  },

  findById(id: number): Promise<AccessAccount | null> {
    return prisma.accessAccount.findUnique({ where: { id } });
  },

  findByIdWithProfiles(product: Product, id: number): Promise<AccountWithProfiles | null> {
    return prisma.accessAccount.findUnique({ where: { id }, include: companyView(product) });
  },

  /**
   * `skip`/`take` are optional — `account.service.ts`'s `profileCount`
   * fallback path fetches every `where`-matched row (no `take`) to
   * filter/sort on that computed value in memory.
   */
  findMany(
    product: Product,
    where: Prisma.AccessAccountWhereInput,
    orderBy: Prisma.AccessAccountOrderByWithRelationInput[],
    skip?: number,
    take?: number,
  ): Promise<AccountWithProfiles[]> {
    return prisma.accessAccount.findMany({
      where,
      orderBy,
      include: companyView(product),
      ...(skip === undefined ? {} : { skip }),
      ...(take === undefined ? {} : { take }),
    });
  },

  count(where: Prisma.AccessAccountWhereInput): Promise<number> {
    return prisma.accessAccount.count({ where });
  },

  /** Active SUPER_ADMIN accounts, optionally excluding one — see `account-guards.ts`. */
  countActiveSuperAdmins(excludingAccountId?: number): Promise<number> {
    return prisma.accessAccount.count({
      where: {
        role: 'SUPER_ADMIN',
        active: true,
        ...(excludingAccountId === undefined ? {} : { id: { not: excludingAccountId } }),
      },
    });
  },

  /**
   * Self-registration's path: the login and its name, nothing else — no
   * membership, no seat, no profile (docs/adr/0018) and no Person: a person
   * record belongs to a company's registry, and this account has no company yet
   * (docs/adr/0013).
   */
  create(data: CreateAccountData): Promise<AccessAccount> {
    return prisma.accessAccount.create({
      data: { name: data.name, email: data.email, password: data.passwordHash },
    });
  },

  /**
   * The admin-initiated path: gives a login to a Person of the caller's
   * company. The account takes the person's name and joins the company as a
   * plain member linked to that person — no seat and no profile: those are
   * granted separately (docs/adr/0018). `Person.types` is left alone; it is the
   * ERP's classification, not a record of who can sign in (docs/adr/0013).
   */
  async createForPerson(data: CreateAccountForPersonData): Promise<AccessAccount> {
    try {
      return await withTransaction(async (tx) => {
        const person = await tx.person.findUniqueOrThrow({ where: { id: data.personId } });

        return tx.accessAccount.create({
          data: {
            name: person.name,
            email: data.email,
            password: data.passwordHash,
            memberships: { create: { companyId: data.companyId, personId: person.id } },
          },
        });
      });
    } catch (error) {
      if (isPrismaCode(error, RECORD_NOT_FOUND)) {
        throw new NotFoundError('Person not found');
      }
      if (isPrismaCode(error, UNIQUE_CONSTRAINT_VIOLATION)) {
        throw new ConflictError(
          targetIncludes(error, 'personId')
            ? 'This person already has an account'
            : 'Email already exists',
        );
      }
      throw error;
    }
  },

  async updateRoleActive(
    id: number,
    data: { role?: AccountRole | undefined; active?: boolean | undefined },
  ): Promise<AccessAccount> {
    // Prisma's update `data` type rejects explicit `undefined` values under
    // exactOptionalPropertyTypes, so unset fields are omitted entirely rather
    // than passed through as `undefined`.
    const patch: Prisma.AccessAccountUpdateInput = {
      ...(data.role === undefined ? {} : { role: data.role }),
      ...(data.active === undefined ? {} : { active: data.active }),
    };

    try {
      return await prisma.accessAccount.update({
        where: { id },
        data: patch,
      });
    } catch (error) {
      if (isPrismaCode(error, RECORD_NOT_FOUND)) {
        throw new NotFoundError('Account not found');
      }
      throw error;
    }
  },

  /**
   * Replaces the member's profile in `product` with `profileId`, or removes it
   * (`null`). Refused (404) for a profile of another product or company, and
   * (409) if it would leave the company with no one able to manage this
   * product's profiles.
   */
  async setProfile(
    product: Product,
    membershipId: string,
    profileId: number | null,
  ): Promise<void> {
    await withProfileManagerGuard(product, async (tx) => {
      if (profileId !== null) {
        const profile = await tx.accessProfile.findFirst({ where: { id: profileId, product } });

        if (!profile) {
          throw new NotFoundError('Profile not found');
        }
      }

      await tx.membershipProfile.deleteMany({ where: { membershipId, product } });

      if (profileId !== null) {
        await tx.membershipProfile.create({
          data: { companyId: requireCompanyId(), membershipId, product, profileId },
        });
      }
    });
  },
};
