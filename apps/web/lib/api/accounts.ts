import 'server-only';

import type { AccountCreateInput, AccountDto, AccountUpdateInput } from '@oliveira/schemas';
import { apiRequest, type ApiResult } from './client';

const BASE = '/api/accounts';

export function requestAccountList(
  token: string,
  query: { personId?: string } = {},
): Promise<ApiResult<AccountDto[]>> {
  return apiRequest<AccountDto[]>(BASE, { token, query });
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
