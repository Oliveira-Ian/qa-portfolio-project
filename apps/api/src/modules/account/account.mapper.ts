import type { AccountDto } from '@oliveira/schemas';
import type { AccountWithProfiles } from './account.repository.js';

/** `row` is one product's view of the account (`accountRepository`'s `companyView`). */
export function toAccountDto(row: AccountWithProfiles): AccountDto {
  const membership = row.memberships[0];

  return {
    id: row.id,
    personId: membership?.personId ?? null,
    personName: row.name,
    email: row.email,
    role: row.role,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    profile: membership?.profiles[0]?.profile ?? null,
  };
}
