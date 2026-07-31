import type { AccountDto } from '@oliveira/schemas';
import type { AccountWithProfiles } from './account.repository.js';

export function toAccountDto(row: AccountWithProfiles): AccountDto {
  return {
    id: row.id,
    personId: row.personId,
    personName: row.person.name,
    email: row.email,
    role: row.role,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    profiles: row.profiles.map((link) => ({ id: link.profile.id, name: link.profile.name })),
  };
}
