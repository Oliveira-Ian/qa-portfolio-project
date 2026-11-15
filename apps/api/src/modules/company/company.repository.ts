import type {
  AccessAccount,
  Company,
  CompanyProduct,
  Membership,
  Person,
  ProductAccess,
} from '../../generated/prisma/client.js';
import {
  PRODUCT_LABELS,
  type MembershipRole,
  type MembershipStatus,
  type Product,
} from '@oliveira/schemas';
import { prisma } from '../../config/prisma.js';
import { ConflictError, NotFoundError } from '../../shared/errors.js';
import { countCompanyAdmins, countProfileManagers, lockCompany } from './company-guards.js';

export type MembershipWithAccess = Membership & {
  company: Company & { products: CompanyProduct[] };
  productAccess: ProductAccess[];
};

export type MemberRow = Membership & {
  account: AccessAccount & { person: Person };
  productAccess: ProductAccess[];
};

const memberInclude = {
  account: { include: { person: true } },
  productAccess: true,
} as const;

const LAST_ADMIN_MESSAGE = 'The company must keep at least one administrator';
const LAST_PROFILE_MANAGER_MESSAGE = 'At least one member must keep the ability to manage profiles';

/**
 * The only place in the company module that knows Prisma exists — same
 * boundary as `account.repository.ts`.
 *
 * Every write that can take something away from a company (its last
 * administrator, its last profile manager, a seat beyond its limit) runs in one
 * transaction that locks the company row first, so two administrators acting at
 * the same moment cannot both pass a check that neither sees the other's half of.
 */
export const companyRepository = {
  /**
   * Every active membership of the account, with its company's contracts and
   * its own seats — everything `companyService.resolveAccess()` needs in one
   * round trip, because it runs on every authenticated request.
   */
  findActiveMemberships(accountId: number): Promise<MembershipWithAccess[]> {
    return prisma.membership.findMany({
      where: { accountId, status: 'ACTIVE' },
      include: { company: { include: { products: true } }, productAccess: true },
    });
  },

  /** The account's membership in one company, active or not, with its seats. */
  findMembership(
    accountId: number,
    companyId: string,
  ): Promise<(Membership & { productAccess: ProductAccess[] }) | null> {
    return prisma.membership.findUnique({
      where: { accountId_companyId: { accountId, companyId } },
      include: { productAccess: true },
    });
  },

  findCompany(companyId: string): Promise<Company | null> {
    return prisma.company.findUnique({ where: { id: companyId } });
  },

  findContracts(companyId: string): Promise<CompanyProduct[]> {
    return prisma.companyProduct.findMany({ where: { companyId }, orderBy: { product: 'asc' } });
  },

  listMembers(companyId: string): Promise<MemberRow[]> {
    return prisma.membership.findMany({
      where: { companyId },
      include: memberInclude,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  },

  findMember(id: string, companyId: string): Promise<MemberRow | null> {
    return prisma.membership.findFirst({ where: { id, companyId }, include: memberInclude });
  },

  /** Seats in use per product: the ones held by members whose membership is active. */
  async countSeatsUsed(companyId: string): Promise<Map<Product, number>> {
    const rows = await prisma.productAccess.groupBy({
      by: ['product'],
      where: { membership: { companyId, status: 'ACTIVE' } },
      _count: { _all: true },
    });

    return new Map(rows.map((row) => [row.product, row._count._all]));
  },

  /**
   * Changes a member's status or company role. Refused (409, nothing written)
   * if it would leave the company with no active administrator, or with no one
   * able to manage the ERP's profiles — a deactivated member holds no seat that
   * counts.
   */
  updateMember(
    id: string,
    companyId: string,
    data: { status?: MembershipStatus | undefined; role?: MembershipRole | undefined },
  ): Promise<MemberRow> {
    // `exactOptionalPropertyTypes`: unset fields are left out rather than passed as `undefined`.
    const patch = {
      ...(data.status === undefined ? {} : { status: data.status }),
      ...(data.role === undefined ? {} : { role: data.role }),
    };

    return prisma.$transaction(async (tx) => {
      await lockCompany(tx, companyId);

      const current = await tx.membership.findFirst({ where: { id, companyId } });

      if (!current) {
        throw new NotFoundError('Member not found');
      }

      const adminsBefore = await countCompanyAdmins(tx, companyId);
      const managersBefore = await countProfileManagers(tx, companyId);

      await tx.membership.update({ where: { id }, data: patch });

      if (adminsBefore > 0 && (await countCompanyAdmins(tx, companyId)) === 0) {
        throw new ConflictError(LAST_ADMIN_MESSAGE);
      }

      if (managersBefore > 0 && (await countProfileManagers(tx, companyId)) === 0) {
        throw new ConflictError(LAST_PROFILE_MANAGER_MESSAGE);
      }

      return tx.membership.findUniqueOrThrow({ where: { id }, include: memberInclude });
    });
  },

  /**
   * Grants the member a seat in the product, inside the company's contract.
   * Returns false when the member already held it (nothing to do). The first
   * ERP seat of an account with no profile also links the `isDefault` profile —
   * registration grants nothing, so this is where a member gets a starting point
   * (docs/adr/0018).
   */
  grantSeat(input: {
    membershipId: string;
    companyId: string;
    product: Product;
    grantedById: number;
  }): Promise<boolean> {
    const { membershipId, companyId, product, grantedById } = input;

    return prisma.$transaction(async (tx) => {
      await lockCompany(tx, companyId);

      const membership = await tx.membership.findFirst({
        where: { id: membershipId, companyId },
        include: { productAccess: true },
      });

      if (!membership) {
        throw new NotFoundError('Member not found');
      }

      if (membership.status !== 'ACTIVE') {
        throw new ConflictError('This member is inactive');
      }

      if (membership.productAccess.some((seat) => seat.product === product)) {
        return false;
      }

      const contract = await tx.companyProduct.findUnique({
        where: { companyId_product: { companyId, product } },
      });

      if (!contract || contract.status !== 'ACTIVE') {
        throw new ConflictError(
          `Your company has no active contract for ${PRODUCT_LABELS[product]}`,
        );
      }

      if (contract.seatLimit !== null) {
        const used = await tx.productAccess.count({
          where: { product, membership: { companyId, status: 'ACTIVE' } },
        });

        if (used >= contract.seatLimit) {
          throw new ConflictError(
            `No licenses left for ${PRODUCT_LABELS[product]}. Contact Oliveira to raise the limit.`,
          );
        }
      }

      await tx.productAccess.create({ data: { membershipId, product, grantedById } });

      if (product === 'ERP') {
        const profileLinks = await tx.accountProfile.count({
          where: { accountId: membership.accountId },
        });
        const defaultProfile =
          profileLinks === 0
            ? await tx.accessProfile.findFirst({ where: { isDefault: true } })
            : null;

        if (defaultProfile) {
          await tx.accountProfile.create({
            data: { accountId: membership.accountId, profileId: defaultProfile.id },
          });
        }
      }

      return true;
    });
  },

  /**
   * Takes the seat away. Returns false when the member had none. Refused (409)
   * if it would leave the company with no one able to manage the ERP's
   * profiles. Profile links are left in place — dormant without the seat.
   */
  revokeSeat(input: {
    membershipId: string;
    companyId: string;
    product: Product;
  }): Promise<boolean> {
    const { membershipId, companyId, product } = input;

    return prisma.$transaction(async (tx) => {
      await lockCompany(tx, companyId);

      const membership = await tx.membership.findFirst({ where: { id: membershipId, companyId } });

      if (!membership) {
        throw new NotFoundError('Member not found');
      }

      const managersBefore = await countProfileManagers(tx, companyId);
      const { count } = await tx.productAccess.deleteMany({ where: { membershipId, product } });

      if (managersBefore > 0 && (await countProfileManagers(tx, companyId)) === 0) {
        throw new ConflictError(LAST_PROFILE_MANAGER_MESSAGE);
      }

      return count > 0;
    });
  },

  /**
   * Adds an existing account to the company. Returns the membership, or `null`
   * when there is nothing to add — no such account, an inactive or SYSTEM one, or
   * one that already belongs to a company — and the caller must not say which
   * (docs/especificacoes/platform-access-model.md, rule 7).
   */
  addMemberByEmail(companyId: string, email: string): Promise<Membership | null> {
    return prisma.$transaction(async (tx) => {
      await lockCompany(tx, companyId);

      const account = await tx.accessAccount.findUnique({
        where: { email },
        include: { memberships: { select: { id: true } } },
      });

      if (
        !account ||
        !account.active ||
        account.role === 'SYSTEM' ||
        account.memberships.length > 0
      ) {
        return null;
      }

      return tx.membership.create({ data: { accountId: account.id, companyId } });
    });
  },
};
