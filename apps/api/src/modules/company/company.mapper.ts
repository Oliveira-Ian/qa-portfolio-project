import { PRODUCTS, type CompanyMemberDto } from '@oliveira/schemas';
import type { MemberRow } from './company.repository.js';

export function toMemberDto(row: MemberRow): CompanyMemberDto {
  return {
    id: row.id,
    accountId: row.accountId,
    name: row.account.name,
    email: row.account.email,
    role: row.role,
    status: row.status,
    accountRole: row.account.role,
    accountActive: row.account.active,
    products: PRODUCTS.filter((product) =>
      row.productAccess.some((seat) => seat.product === product),
    ),
    createdAt: row.createdAt.toISOString(),
  };
}
