import type { BranchDto, BranchWriteInput } from '@oliveira/schemas';
import { toAddressDto } from '../address/address-sync.js';
import type { BranchRow, BranchWriteData } from './branch.repository.js';

const orNull = (value: string): string | null => (value.trim() === '' ? null : value.trim());

export function toBranchWriteData(input: BranchWriteInput): BranchWriteData {
  const document = input.document.replace(/\D/g, '');

  return {
    code: input.code,
    name: input.name,
    document: document === '' ? null : document,
    stateRegistration: orNull(input.stateRegistration),
    email: orNull(input.email),
    phone: orNull(input.phone),
    active: input.active,
  };
}

export function toBranchDto(row: BranchRow): BranchDto {
  const address = row.addresses[0];

  return {
    id: row.id,
    code: row.code,
    name: row.name,
    document: row.document,
    stateRegistration: row.stateRegistration,
    email: row.email,
    phone: row.phone,
    active: row.active,
    address: address ? toAddressDto(address) : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
