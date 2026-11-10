import type { AddressWriteInput, ContactWriteInput } from '@oliveira/schemas';
import type { Prisma } from '../../generated/prisma/client.js';
import { prisma, withTransaction } from '../../config/prisma.js';
import { ConflictError, NotFoundError } from '../../shared/errors.js';
import {
  FOREIGN_KEY_VIOLATION,
  RECORD_NOT_FOUND,
  UNIQUE_CONSTRAINT_VIOLATION,
  isPrismaCode,
} from '../../shared/prisma-errors.js';
import { requireCompanyId } from '../../shared/request-context.js';
import {
  ADDRESS_ORDER,
  CONTACT_ORDER,
  syncAddresses,
  syncContacts,
} from '../address/address-sync.js';
import type { PersonRowWithRelations, PersonWriteData } from './person.mapper.js';

/** A person's addresses and contact people, written as complete sets. */
export interface PersonLists {
  addresses: AddressWriteInput[];
  contacts: ContactWriteInput[];
}

const NO_LISTS: PersonLists = { addresses: [], contacts: [] };

/** What a list needs of each person: the primary address, for its city and state. */
const PRIMARY_ADDRESS = {
  addresses: { where: { isPrimary: true }, take: 1 },
} satisfies Prisma.PersonInclude;

/** A record: both lists, primary first. */
const FULL_RECORD = {
  addresses: { orderBy: ADDRESS_ORDER },
  contacts: { orderBy: CONTACT_ORDER },
} satisfies Prisma.PersonInclude;

const ADDRESS_IN_USE = 'An address in use by equipment or work orders cannot be removed';

/** What a failed write means: a taken document, an unknown person, or an address still in use. */
function translateWriteError(error: unknown): unknown {
  if (isPrismaCode(error, RECORD_NOT_FOUND)) {
    return new NotFoundError('Person not found');
  }
  if (isPrismaCode(error, UNIQUE_CONSTRAINT_VIOLATION)) {
    return new ConflictError(DOCUMENT_TAKEN);
  }
  if (isPrismaCode(error, FOREIGN_KEY_VIOLATION)) {
    return new ConflictError(ADDRESS_IN_USE);
  }

  return error;
}

/**
 * A person's only unique constraint is `(companyId, document, documentType)`, so
 * a unique violation on a write can only mean the document is already registered
 * in this company. Two people without a document never collide: Postgres treats
 * nulls as distinct.
 */
const DOCUMENT_TAKEN = 'A person with this document already exists';

/**
 * The boundary where Prisma stops. Its error codes are translated into domain
 * errors here so nothing above has to know what `P2025` means — that's what
 * used to make `PUT`/`DELETE` on an unknown id answer 500 instead of 404.
 *
 * Every query is the caller's company's: the Prisma client scopes it and the
 * database's row-level security enforces it (docs/adr/0012). Another company's
 * id reads as "not found", exactly like an id that never existed.
 */
export const personRepository = {
  findMany(
    where: Prisma.PersonWhereInput,
    orderBy: Prisma.PersonOrderByWithRelationInput[],
    skip: number,
    take: number,
  ): Promise<PersonRowWithRelations[]> {
    return prisma.person.findMany({ where, orderBy, skip, take, include: PRIMARY_ADDRESS });
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
    recent: PersonRowWithRelations[];
  }> {
    const [total, clients, suppliers, inactive, recent] = await Promise.all([
      prisma.person.count(),
      prisma.person.count({ where: { types: { has: 'CLIENT' } } }),
      prisma.person.count({ where: { types: { has: 'SUPPLIER' } } }),
      prisma.person.count({ where: { active: false } }),
      prisma.person.findMany({
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        take: 5,
        include: PRIMARY_ADDRESS,
      }),
    ]);

    return { total, clients, suppliers, inactive, recent };
  },

  findById(id: string): Promise<PersonRowWithRelations | null> {
    return prisma.person.findUnique({ where: { id }, include: FULL_RECORD });
  },

  /** The person and its lists in one transaction — all saved or none. */
  async create(
    data: PersonWriteData,
    lists: PersonLists = NO_LISTS,
  ): Promise<PersonRowWithRelations> {
    try {
      return await withTransaction(async (tx) => {
        const companyId = requireCompanyId();
        const person = await tx.person.create({ data: { ...data, companyId } });

        await syncAddresses(tx, companyId, { personId: person.id }, lists.addresses);
        await syncContacts(tx, companyId, person.id, lists.contacts);

        return tx.person.findUniqueOrThrow({ where: { id: person.id }, include: FULL_RECORD });
      });
    } catch (error) {
      throw translateWriteError(error);
    }
  },

  async update(
    id: string,
    data: PersonWriteData,
    lists: PersonLists,
  ): Promise<PersonRowWithRelations> {
    try {
      return await withTransaction(async (tx) => {
        const companyId = requireCompanyId();

        await tx.person.update({ where: { id }, data });
        await syncAddresses(tx, companyId, { personId: id }, lists.addresses);
        await syncContacts(tx, companyId, id, lists.contacts);

        return tx.person.findUniqueOrThrow({ where: { id }, include: FULL_RECORD });
      });
    } catch (error) {
      throw translateWriteError(error);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await prisma.person.delete({ where: { id } });
    } catch (error) {
      if (isPrismaCode(error, RECORD_NOT_FOUND)) {
        throw new NotFoundError('Person not found');
      }
      // Membership.personId is `ON DELETE RESTRICT` on purpose (see
      // prisma/schema.prisma) — silently unlinking would leave a member's login
      // pointing at nobody the moment someone deletes the person behind it.
      // The fix here is a clear, actionable 409, not changing the constraint.
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
      await withTransaction(async (tx) => {
        for (const id of ids) {
          await tx.person.delete({ where: { id } });
        }
      });
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
