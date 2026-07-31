import type { AccountCreateInput, AccountDto, AccountUpdateInput } from '@oliveira/schemas';
import { NotFoundError } from '../../shared/errors.js';
import { hashPassword } from '../auth/password.js';
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

export const accountService = {
  async list(filter?: { personId?: string }): Promise<AccountDto[]> {
    const rows = await accountRepository.findMany(filter);
    return rows.map(toAccountDto);
  },

  async getById(id: number): Promise<AccountDto> {
    return toAccountDto(await requireAccountWithProfiles(id));
  },

  async create(input: AccountCreateInput): Promise<AccountDto> {
    const created = await accountRepository.createForPerson({
      personId: input.personId,
      email: input.email,
      passwordHash: await hashPassword(input.password),
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

  async linkProfile(accountId: number, profileId: number): Promise<AccountDto> {
    await requireAccountWithProfiles(accountId); // 404 before touching the join table
    await accountRepository.linkProfile(accountId, profileId);

    return toAccountDto(await requireAccountWithProfiles(accountId));
  },

  async unlinkProfile(accountId: number, profileId: number): Promise<AccountDto> {
    await requireAccountWithProfiles(accountId);
    await accountRepository.unlinkProfile(accountId, profileId);

    return toAccountDto(await requireAccountWithProfiles(accountId));
  },
};
