import type {
  Company,
  CompanyProduct,
  Membership,
  ProductAccess,
} from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';

export type MembershipWithAccess = Membership & {
  company: Company & { products: CompanyProduct[] };
  productAccess: ProductAccess[];
};

/**
 * The only place in the company module that knows Prisma exists — same
 * boundary as `account.repository.ts`.
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
};
