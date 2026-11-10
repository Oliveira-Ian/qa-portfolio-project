import type { Prisma } from '../../generated/prisma/client.js';
import type {
  AccountCreateInput,
  AccountDto,
  AccountListQuery,
  AccountUpdateInput,
  PaginatedResult,
  Product,
} from '@oliveira/schemas';
import { NotFoundError } from '../../shared/errors.js';
import {
  buildFiltersWhere,
  resolveSort,
  toSkipTake,
  type FilterFieldMap,
} from '../../shared/list-query.js';
import { requireCompanyId } from '../../shared/request-context.js';
import { hashPassword } from '../auth/password.js';
import { companyService } from '../company/company.service.js';
import { accountRepository } from './account.repository.js';
import { assertAdminChangeAllowed } from './account-guards.js';
import { toAccountDto } from './account.mapper.js';

async function requireAccountWithProfiles(product: Product, id: number) {
  const row = await accountRepository.findByIdWithProfiles(product, id);

  if (!row) {
    throw new NotFoundError('Account not found');
  }

  return row;
}

/** `profile` (the member's profile in the product) is filtered by hand in `list()` — it lives on the membership. */
const ACCOUNT_FILTER_FIELDS: FilterFieldMap = {
  personName: { field: 'name', kind: 'text' },
  email: { field: 'email', kind: 'text' },
  role: { field: 'role', kind: 'enumScalar' },
  active: { field: 'active', kind: 'boolean' },
  createdAt: { field: 'createdAt', kind: 'date' },
};

const ACCOUNT_SORT_FIELDS: Record<string, string> = {
  personName: 'name',
  email: 'email',
  role: 'role',
  active: 'active',
  createdAt: 'createdAt',
};

/**
 * The accounts listing is the company's own: only members of the caller's
 * company, whatever the filters — the account is the global identity, so this is
 * where it is narrowed to the caller's company. The FSM's listing is narrower
 * still: only members holding an FSM seat, the ones its profiles can be given to.
 * The ERP's keeps listing every member, as it always has.
 */
function buildWhere(
  product: Product,
  query: AccountListQuery,
  rawQuery: Record<string, unknown>,
  companyId: string,
): Prisma.AccessAccountWhereInput {
  const companyWhere: Prisma.AccessAccountWhereInput = {
    memberships: {
      some: product === 'ERP' ? { companyId } : { companyId, productAccess: { some: { product } } },
    },
  };
  const scopeWhere: Prisma.AccessAccountWhereInput = query.personId
    ? { memberships: { some: { companyId, personId: query.personId } } }
    : {};

  const searchWhere: Prisma.AccessAccountWhereInput = query.search
    ? {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      }
    : {};

  const columnFiltersWhere = buildFiltersWhere(
    rawQuery,
    ACCOUNT_FILTER_FIELDS,
  ) as Prisma.AccessAccountWhereInput;

  return { AND: [companyWhere, scopeWhere, searchWhere, columnFiltersWhere] };
}

function readTextParam(rawQuery: Record<string, unknown>, key: string): string | undefined {
  const value = rawQuery[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

export const accountService = {
  async list(
    product: Product,
    query: AccountListQuery,
    rawQuery: Record<string, unknown>,
  ): Promise<PaginatedResult<AccountDto>> {
    const companyId = requireCompanyId();
    const profileFilter = readTextParam(rawQuery, 'f_profile');
    const where: Prisma.AccessAccountWhereInput = {
      AND: [
        buildWhere(product, query, rawQuery, companyId),
        profileFilter
          ? {
              memberships: {
                some: {
                  companyId,
                  profiles: {
                    some: {
                      product,
                      profile: { name: { contains: profileFilter, mode: 'insensitive' } },
                    },
                  },
                },
              },
            }
          : {},
      ],
    };
    const orderBy = resolveSort(
      query.sortBy,
      query.sortOrder,
      ACCOUNT_SORT_FIELDS,
      { createdAt: 'desc' },
      { id: 'asc' },
    ) as Prisma.AccessAccountOrderByWithRelationInput[];
    const { skip, take } = toSkipTake(query);

    const [rows, total] = await Promise.all([
      accountRepository.findMany(product, where, orderBy, skip, take),
      accountRepository.count(where),
    ]);

    return { items: rows.map(toAccountDto), total, page: query.page, pageSize: query.pageSize };
  },

  async getById(product: Product, id: number): Promise<AccountDto> {
    await companyService.requireMember(id, requireCompanyId());

    return toAccountDto(await requireAccountWithProfiles(product, id));
  },

  /** Gives a person of the caller's company a login, as a member linked to them — with no seat and no profile. */
  async create(input: AccountCreateInput): Promise<AccountDto> {
    const created = await accountRepository.createForPerson({
      personId: input.personId,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      companyId: requireCompanyId(),
    });

    // Re-read with the profiles and the membership link the DTO needs.
    return toAccountDto(await requireAccountWithProfiles('ERP', created.id));
  },

  async update(id: number, actorAccountId: number, input: AccountUpdateInput): Promise<AccountDto> {
    const current = await requireAccountWithProfiles('ERP', id);

    await assertAdminChangeAllowed({
      accountId: id,
      actorAccountId,
      currentRole: current.role,
      currentActive: current.active,
      nextRole: input.role ?? current.role,
      nextActive: input.active ?? current.active,
    });

    await accountRepository.updateRoleActive(id, { role: input.role, active: input.active });

    return toAccountDto(await requireAccountWithProfiles('ERP', id));
  },

  /**
   * Sets the member's one profile in `product` (`null` removes it). A profile
   * goes only to a member of the caller's company who holds a seat in the
   * product; removing it needs only the membership.
   */
  async setProfile(
    product: Product,
    accountId: number,
    profileId: number | null,
  ): Promise<AccountDto> {
    await requireAccountWithProfiles(product, accountId); // 404 before touching the link
    const membershipId = await companyService.requireMember(
      accountId,
      requireCompanyId(),
      profileId === null ? undefined : product,
    );
    await accountRepository.setProfile(product, membershipId, profileId);

    return toAccountDto(await requireAccountWithProfiles(product, accountId));
  },
};
