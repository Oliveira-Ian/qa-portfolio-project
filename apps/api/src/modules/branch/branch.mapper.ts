import type { Branch } from '../../generated/prisma/client.js';
import type { BranchDto, BranchWriteInput } from '@oliveira/schemas';
import type { BranchWriteData } from './branch.repository.js';

const orNull = (value: string | undefined): string | null => (value ? value : null);

export function toBranchWriteData(input: BranchWriteInput): BranchWriteData {
  return {
    code: input.code,
    name: input.name,
    street: orNull(input.street),
    city: orNull(input.city),
    state: input.state ? input.state.toUpperCase() : null,
    zipCode: orNull(input.zipCode),
    active: input.active,
  };
}

export function toBranchDto(row: Branch): BranchDto {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    street: row.street,
    city: row.city,
    state: row.state,
    zipCode: row.zipCode,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
