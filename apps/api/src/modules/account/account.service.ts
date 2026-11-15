import type { Prisma } from '../../generated/prisma/client.js';
import type {
  AccountCreateInput,
  AccountDto,
  AccountListQuery,
  AccountUpdateInput,
  PaginatedResult,
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

async function requireAccountWithProfiles(id: number) {
  const row = await accountRepository.findByIdWithProfiles(id);

  if (!row) {
    throw new NotFoundError('Account not found');
  }

  return row;
}

/** `profileCount` (`account.profiles.length`) has no entry — it's computed, not a column; see `list()`'s fallback path below. */
const ACCOUNT_FILTER_FIELDS: FilterFieldMap = {
  personName: { field: 'person.name', kind: 'text' },
  email: { field: 'email', kind: 'text' },
  role: { field: 'role', kind: 'enumScalar' },
  active: { field: 'active', kind: 'boolean' },
  createdAt: { field: 'createdAt', kind: 'date' },
};

const ACCOUNT_SORT_FIELDS: Record<string, string> = {
  personName: 'person.name',
  email: 'email',
  role: 'role',
  active: 'active',
  createdAt: 'createdAt',
};

/**
 * The accounts listing is the company's own: only members of the caller's
 * company, whatever the filters. Until the business tables are scoped (#60) this
 * is the one place an account is looked up by company.
 */
function buildWhere(
  query: AccountListQuery,
  rawQuery: Record<string, unknown>,
  companyId: string,
): Prisma.AccessAccountWhereInput {
  const companyWhere: Prisma.AccessAccountWhereInput = { memberships: { some: { companyId } } };
  const scopeWhere: Prisma.AccessAccountWhereInput = query.personId
    ? { personId: query.personId }
    : {};

  const searchWhere: Prisma.AccessAccountWhereInput = query.search
    ? {
        OR: [
          { person: { name: { contains: query.search, mode: 'insensitive' } } },
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

function readNumberParam(rawQuery: Record<string, unknown>, key: string): number | undefined {
  const value = rawQuery[key];
  return typeof value === 'string' && value.length > 0 ? Number(value) : undefined;
}

export const accountService = {
  async list(
    query: AccountListQuery,
    rawQuery: Record<string, unknown>,
  ): Promise<PaginatedResult<AccountDto>> {
    const where = buildWhere(query, rawQuery, requireCompanyId());
    const profileCountRange = {
      min: readNumberParam(rawQuery, 'f_profileCount_min'),
      max: readNumberParam(rawQuery, 'f_profileCount_max'),
    };
    const hasCountFilter =
      profileCountRange.min !== undefined || profileCountRange.max !== undefined;
    const sortsByCount = query.sortBy === 'profileCount';

    if (!hasCountFilter && !sortsByCount) {
      const orderBy = resolveSort(
        query.sortBy,
        query.sortOrder,
        ACCOUNT_SORT_FIELDS,
        { createdAt: 'desc' },
        { id: 'asc' },
      ) as Prisma.AccessAccountOrderByWithRelationInput[];
      const { skip, take } = toSkipTake(query);

      const [rows, total] = await Promise.all([
        accountRepository.findMany(where, orderBy, skip, take),
        accountRepository.count(where),
      ]);

      return { items: rows.map(toAccountDto), total, page: query.page, pageSize: query.pageSize };
    }

    // `profileCount` is `account.profiles.length`, not a column — same
    // computed-value tradeoff as `profile.service.ts`'s `permissionCount`:
    // fetch every `where`-matched row and handle it in memory. Accounts is
    // an administration list, not a business table, so this stays bounded.
    const allRows = await accountRepository.findMany(where, [{ createdAt: 'desc' }, { id: 'asc' }]);
    let dtos = allRows.map(toAccountDto);

    if (hasCountFilter) {
      dtos = dtos.filter((account) => {
        const count = account.profiles.length;

        if (profileCountRange.min !== undefined && count < profileCountRange.min) {
          return false;
        }

        if (profileCountRange.max !== undefined && count > profileCountRange.max) {
          return false;
        }

        return true;
      });
    }

    if (sortsByCount) {
      const direction = query.sortOrder === 'desc' ? -1 : 1;
      dtos = [...dtos].sort((a, b) => direction * (a.profiles.length - b.profiles.length));
    }

    const total = dtos.length;
    const { skip, take } = toSkipTake(query);

    return {
      items: dtos.slice(skip, skip + take),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  },

  async getById(id: number): Promise<AccountDto> {
    await companyService.requireMember(id, requireCompanyId());

    return toAccountDto(await requireAccountWithProfiles(id));
  },

  /** Gives the person a login and makes it a member of the caller's company — with no seat and no profile. */
  async create(input: AccountCreateInput): Promise<AccountDto> {
    const created = await accountRepository.createForPerson({
      personId: input.personId,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      companyId: requireCompanyId(),
    });

    // Re-read with the profile link included — createForPerson only returns
    // { ...account, person }, and the DTO needs the profiles list too.
    return toAccountDto(await requireAccountWithProfiles(created.id));
  },

  async update(id: number, actorAccountId: number, input: AccountUpdateInput): Promise<AccountDto> {
    const current = await requireAccountWithProfiles(id);

    await assertAdminChangeAllowed({
      accountId: id,
      actorAccountId,
      currentRole: current.role,
      currentActive: current.active,
      nextRole: input.role ?? current.role,
      nextActive: input.active ?? current.active,
    });

    await accountRepository.updateRoleActive(id, { role: input.role, active: input.active });

    return toAccountDto(await requireAccountWithProfiles(id));
  },

  /** ERP profiles go only to a member of the caller's company who holds an ERP seat. */
  async linkProfile(accountId: number, profileId: number): Promise<AccountDto> {
    await requireAccountWithProfiles(accountId); // 404 before touching the join table
    await companyService.requireMember(accountId, requireCompanyId(), 'ERP');
    await accountRepository.linkProfile(accountId, profileId);

    return toAccountDto(await requireAccountWithProfiles(accountId));
  },

  async unlinkProfile(accountId: number, profileId: number): Promise<AccountDto> {
    await requireAccountWithProfiles(accountId);
    await companyService.requireMember(accountId, requireCompanyId());
    await accountRepository.unlinkProfile(accountId, profileId);

    return toAccountDto(await requireAccountWithProfiles(accountId));
  },
};
