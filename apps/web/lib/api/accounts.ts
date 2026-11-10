import 'server-only';

import type {
  AccountCreateInput,
  AccountDto,
  AccountUpdateInput,
  PaginatedResult,
  Product,
} from '@oliveira/schemas';
import { serializeListQuery, type ListQueryState } from '@/lib/list-query';
import { apiRequest, type ApiResult } from './client';

/** The ERP's routes keep their historical prefix; every other product's live under its own. */
const PRODUCT_BASE: Record<Product, string> = {
  ERP: '/api/accounts',
  FSM: '/api/fsm/accounts',
};

/**
 * The company's members as one product sees them, each with their profile
 * there. `personId` scopes to the one account linked to that person (0 or 1
 * result) — used by the Person edit page.
 */
export function requestAccountList(
  token: string,
  query: ListQueryState,
  personId?: string,
  product: Product = 'ERP',
): Promise<ApiResult<PaginatedResult<AccountDto>>> {
  const params = new URLSearchParams(serializeListQuery(query));

  if (personId) {
    params.set('personId', personId);
  }

  return apiRequest<PaginatedResult<AccountDto>>(PRODUCT_BASE[product], {
    token,
    query: Object.fromEntries(params),
  });
}

export function requestAccount(
  token: string,
  id: number,
  product: Product,
): Promise<ApiResult<AccountDto>> {
  return apiRequest<AccountDto>(`${PRODUCT_BASE[product]}/${id}`, { token });
}

/** The member's one profile in `product`; `null` removes it. */
export function requestAccountSetProfile(
  token: string,
  id: number,
  profileId: number | null,
  product: Product,
): Promise<ApiResult<AccountDto>> {
  return apiRequest<AccountDto>(`${PRODUCT_BASE[product]}/${id}/profile`, {
    method: 'PUT',
    token,
    body: { profileId },
  });
}

/** Gives a person of the registry a login — the ERP's, company admins only. */
export function requestAccountCreate(
  token: string,
  input: AccountCreateInput,
): Promise<ApiResult<AccountDto>> {
  return apiRequest<AccountDto>(PRODUCT_BASE.ERP, { method: 'POST', token, body: input });
}

/** An account's Platform role and active flag — `SUPER_ADMIN` only. */
export function requestAccountUpdate(
  token: string,
  id: number,
  input: AccountUpdateInput,
): Promise<ApiResult<AccountDto>> {
  return apiRequest<AccountDto>(`${PRODUCT_BASE.ERP}/${id}`, {
    method: 'PATCH',
    token,
    body: input,
  });
}
