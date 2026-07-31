import 'server-only';

import type {
  AccountCreateInput,
  AccountDto,
  AccountUpdateInput,
  PaginatedResult,
} from '@oliveira/schemas';
import { serializeListQuery, type ListQueryState } from '@/lib/list-query';
import { apiRequest, type ApiResult } from './client';

const BASE = '/api/accounts';

/** `personId` scopes to the one account belonging to that person (0 or 1 result) — used by the Person edit page, independent of the Users listing screen's own paginated `query`. */
export function requestAccountList(
  token: string,
  query: ListQueryState,
  personId?: string,
): Promise<ApiResult<PaginatedResult<AccountDto>>> {
  const params = new URLSearchParams(serializeListQuery(query));

  if (personId) {
    params.set('personId', personId);
  }

  return apiRequest<PaginatedResult<AccountDto>>(BASE, {
    token,
    query: Object.fromEntries(params),
  });
}

export function requestAccountCreate(
  token: string,
  input: AccountCreateInput,
): Promise<ApiResult<AccountDto>> {
  return apiRequest<AccountDto>(BASE, { method: 'POST', token, body: input });
}

export function requestAccountUpdate(
  token: string,
  id: number,
  input: AccountUpdateInput,
): Promise<ApiResult<AccountDto>> {
  return apiRequest<AccountDto>(`${BASE}/${id}`, { method: 'PATCH', token, body: input });
}

export function requestAccountLinkProfile(
  token: string,
  id: number,
  profileId: number,
): Promise<ApiResult<AccountDto>> {
  return apiRequest<AccountDto>(`${BASE}/${id}/profiles`, {
    method: 'POST',
    token,
    body: { profileId },
  });
}

export function requestAccountUnlinkProfile(
  token: string,
  id: number,
  profileId: number,
): Promise<ApiResult<AccountDto>> {
  return apiRequest<AccountDto>(`${BASE}/${id}/profiles/${profileId}`, {
    method: 'DELETE',
    token,
  });
}
