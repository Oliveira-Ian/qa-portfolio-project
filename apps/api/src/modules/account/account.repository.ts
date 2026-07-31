import type { AccessAccount, AccountRole, Person, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ConflictError, NotFoundError } from '../../shared/errors.js';
import {
  RECORD_NOT_FOUND,
  UNIQUE_CONSTRAINT_VIOLATION,
  isPrismaCode,
} from '../../shared/prisma-errors.js';

export type AccountWithPerson = AccessAccount & { person: Person };
export type AccountWithProfiles = AccountWithPerson & {
  profiles: { profile: { id: number; name: string } }[];
};

export interface CreateAccountData {
  name: string;
  email: string;
  passwordHash: string;
  birthDate: Date | null;
}

export interface CreateAccountForPersonData {
  personId: string;
  email: string;
  passwordHash: string;
}

function targetIncludes(error: unknown, field: string): boolean {
  const target = (error as { meta?: { target?: unknown } }).meta?.target;
  return Array.isArray(target) && target.includes(field);
}

/** Links a newly-created account to the `isDefault` profile, if one is seeded. */
async function linkDefaultProfile(tx: Prisma.TransactionClient, accountId: number) {
  const defaultProfile = await tx.accessProfile.findFirst({ where: { isDefault: true } });

  if (defaultProfile) {
    await tx.accountProfile.create({ data: { accountId, profileId: defaultProfile.id } });
  }
}

/**
 * The only place in the account module that knows Prisma exists. Everything
 * above it works with plain objects, which is what makes the service testable
 * without a database.
 */
export const accountRepository = {
  findByEmail(email: string): Promise<AccountWithPerson | null> {
    return prisma.accessAccount.findUnique({ where: { email }, include: { person: true } });
  },

  findById(id: number): Promise<AccountWithPerson | null> {
    return prisma.accessAccount.findUnique({ where: { id }, include: { person: true } });
  },

  findByIdWithProfiles(id: number): Promise<AccountWithProfiles | null> {
    return prisma.accessAccount.findUnique({
      where: { id },
      include: {
        person: true,
        profiles: { include: { profile: { select: { id: true, name: true } } } },
      },
    });
  },

  /**
   * `skip`/`take` are optional — `account.service.ts`'s `profileCount`
   * fallback path fetches every `where`-matched row (no `take`) to
   * filter/sort on that computed value in memory.
   */
  findMany(
    where: Prisma.AccessAccountWhereInput,
    orderBy: Prisma.AccessAccountOrderByWithRelationInput[],
    skip?: number,
    take?: number,
  ): Promise<AccountWithProfiles[]> {
    return prisma.accessAccount.findMany({
      where,
      orderBy,
      include: {
        person: true,
        profiles: { include: { profile: { select: { id: true, name: true } } } },
      },
      ...(skip === undefined ? {} : { skip }),
      ...(take === undefined ? {} : { take }),
    });
  },

  count(where: Prisma.AccessAccountWhereInput): Promise<number> {
    return prisma.accessAccount.count({ where });
  },

  /** Active ADMIN accounts, optionally excluding one — see `account-guards.ts`. */
  countActiveAdmins(excludingAccountId?: number): Promise<number> {
    return prisma.accessAccount.count({
      where: {
        role: 'ADMIN',
        active: true,
        ...(excludingAccountId === undefined ? {} : { id: { not: excludingAccountId } }),
      },
    });
  },

  /**
   * Self-registration's path: creates the Person too (types: ["USER"]) and
   * links the `isDefault` profile — a database that hasn't been seeded yet
   * (so no profile is marked default) still lets registration succeed with
   * no profile attached, rather than failing.
   */
  createWithPerson(data: CreateAccountData): Promise<AccountWithPerson> {
    return prisma.$transaction(async (tx) => {
      const person = await tx.person.create({
        data: {
          name: data.name,
          email: data.email,
          birthdate: data.birthDate,
          types: ['USER'],
        },
      });

      const account = await tx.accessAccount.create({
        data: { personId: person.id, email: data.email, password: data.passwordHash },
      });

      await linkDefaultProfile(tx, account.id);

      return { ...account, person };
    });
  },

  /**
   * The admin-initiated path: grants a login to a Person who already exists
   * in the registry, rather than creating a new one. Ensures `types`
   * includes `USER` (a person with an account is a user by definition) and
   * links the `isDefault` profile, same as self-registration.
   */
  async createForPerson(data: CreateAccountForPersonData): Promise<AccountWithPerson> {
    try {
      return await prisma.$transaction(async (tx) => {
        const person = await tx.person.findUniqueOrThrow({ where: { id: data.personId } });

        if (!person.types.includes('USER')) {
          await tx.person.update({
            where: { id: person.id },
            data: { types: { push: 'USER' } },
          });
        }

        const account = await tx.accessAccount.create({
          data: { personId: data.personId, email: data.email, password: data.passwordHash },
        });

        await linkDefaultProfile(tx, account.id);

        return { ...account, person };
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
  ): Promise<AccountWithPerson> {
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
        include: { person: true },
      });
    } catch (error) {
      if (isPrismaCode(error, RECORD_NOT_FOUND)) {
        throw new NotFoundError('Account not found');
      }
      throw error;
    }
  },

  /** Idempotent — linking a profile that's already attached is not an error. */
  async linkProfile(accountId: number, profileId: number): Promise<void> {
    await prisma.accountProfile.upsert({
      where: { accountId_profileId: { accountId, profileId } },
      update: {},
      create: { accountId, profileId },
    });
  },

  async unlinkProfile(accountId: number, profileId: number): Promise<void> {
    await prisma.accountProfile.deleteMany({ where: { accountId, profileId } });
  },
};
