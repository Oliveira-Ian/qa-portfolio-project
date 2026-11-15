import {
  PRODUCTS,
  PRODUCT_LABELS,
  type CompanyMemberDto,
  type CompanyMembersDto,
  type MeMembership,
  type MemberAddInput,
  type MemberUpdateInput,
  type Product,
  type SeatChangeDto,
} from '@oliveira/schemas';
import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors.js';
import { requireCompanyId } from '../../shared/request-context.js';
import { toMemberDto } from './company.mapper.js';
import { companyRepository } from './company.repository.js';

/** What an account may enter right now — the answer to layers 2 and 3 of docs/adr/0018. */
export interface AccessSnapshot {
  membership: MeMembership | null;
  /** A suspended company's members keep their membership but can do nothing in it. */
  isCompanyActive: boolean;
  /** Contracted by the company (and the company active) **and** granted to this member. */
  products: ReadonlySet<Product>;
}

const NO_ACCESS: AccessSnapshot = { membership: null, isCompanyActive: false, products: new Set() };

export const companyService = {
  /**
   * Read from the database on every request, never from the token — so a seat
   * revoked, a membership deactivated or a contract suspended takes effect on
   * the account's very next request (see `require-auth.ts`).
   *
   * An account with no membership is a normal state (a newly registered one),
   * not an error. An account with more than one is refused until company
   * switching exists: picking one silently would show a member the wrong
   * company's data once the business tables are scoped.
   */
  async resolveAccess(accountId: number): Promise<AccessSnapshot> {
    const memberships = await companyRepository.findActiveMemberships(accountId);

    const [membership] = memberships;

    if (!membership) {
      return NO_ACCESS;
    }

    if (memberships.length > 1) {
      throw new ForbiddenError('This account belongs to more than one company');
    }

    const contracted = new Set<Product>(
      membership.company.products
        .filter((contract) => contract.status === 'ACTIVE')
        .map((contract) => contract.product),
    );
    const isCompanyActive = membership.company.status === 'ACTIVE';

    const products = new Set<Product>(
      isCompanyActive
        ? PRODUCTS.filter(
            (product) =>
              contracted.has(product) &&
              membership.productAccess.some((seat) => seat.product === product),
          )
        : [],
    );

    return {
      membership: {
        id: membership.id,
        companyId: membership.companyId,
        companyName: membership.company.tradeName ?? membership.company.legalName,
        role: membership.role,
      },
      isCompanyActive,
      products,
    };
  },

  /** The caller's company: its contracts with the seats in use, and every member with the seats they hold. */
  async listMembers(): Promise<CompanyMembersDto> {
    const companyId = requireCompanyId();

    const [company, contracts, seatsUsed, members] = await Promise.all([
      companyRepository.findCompany(companyId),
      companyRepository.findContracts(companyId),
      companyRepository.countSeatsUsed(companyId),
      companyRepository.listMembers(companyId),
    ]);

    if (!company) {
      throw new NotFoundError('Company not found');
    }

    return {
      company: { id: company.id, name: company.tradeName ?? company.legalName },
      products: contracts.map((contract) => ({
        product: contract.product,
        status: contract.status,
        seatLimit: contract.seatLimit,
        seatsUsed: seatsUsed.get(contract.product) ?? 0,
      })),
      members: members.map(toMemberDto),
    };
  },

  /**
   * Returns the new membership, or `null` when nothing was added. The route
   * answers the same either way, so the response never says whether an address
   * has an account (until invitations replace this, docs/adr/0018).
   */
  async addMember(input: MemberAddInput): Promise<{ id: string; accountId: number } | null> {
    const membership = await companyRepository.addMemberByEmail(requireCompanyId(), input.email);

    return membership ? { id: membership.id, accountId: membership.accountId } : null;
  },

  async updateMember(id: string, input: MemberUpdateInput): Promise<CompanyMemberDto> {
    return toMemberDto(await companyRepository.updateMember(id, requireCompanyId(), input));
  },

  /** `changed` is false when the member already held the seat. */
  async grantSeat(id: string, product: Product, grantedById: number): Promise<SeatChangeDto> {
    const changed = await companyRepository.grantSeat({
      membershipId: id,
      companyId: requireCompanyId(),
      product,
      grantedById,
    });

    return { product, changed };
  },

  /** `changed` is false when the member held no such seat. */
  async revokeSeat(id: string, product: Product): Promise<SeatChangeDto> {
    const changed = await companyRepository.revokeSeat({
      membershipId: id,
      companyId: requireCompanyId(),
      product,
    });

    return { product, changed };
  },

  /**
   * 404 unless the account is a member of the company — the company's own data
   * (its accounts) is invisible from outside it, and "not found" doesn't say
   * whether the account exists elsewhere.
   */
  async requireMember(accountId: number, companyId: string, product?: Product): Promise<void> {
    const membership = await companyRepository.findMembership(accountId, companyId);

    if (!membership) {
      throw new NotFoundError('Account not found');
    }

    if (product && !membership.productAccess.some((seat) => seat.product === product)) {
      throw new ConflictError(`This account has no access to ${PRODUCT_LABELS[product]}`);
    }
  },
};
