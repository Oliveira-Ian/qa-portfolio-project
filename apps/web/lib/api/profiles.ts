import 'server-only';

import type { PaginatedResult, Product, ProfileDto, ProfileWriteInput } from '@oliveira/schemas';
import { serializeListQuery, type ListQueryState } from '@/lib/list-query';
import { apiRequest, type ApiResult } from './client';

const BASE = '/api/profiles';

/** Each product's profiles live under its own prefix; the ERP's keep the historical one. */
const PRODUCT_BASE: Record<Product, string> = { ERP: BASE, FSM: '/api/fsm/profiles' };

export function requestProfileList(
  token: string,
  query: ListQueryState,
  product: Product = 'ERP',
): Promise<ApiResult<PaginatedResult<ProfileDto>>> {
  return apiRequest<PaginatedResult<ProfileDto>>(PRODUCT_BASE[product], {
    token,
    query: Object.fromEntries(new URLSearchParams(serializeListQuery(query))),
  });
}

export function requestProfile(
  token: string,
  id: number,
  product: Product = 'ERP',
): Promise<ApiResult<ProfileDto>> {
  return apiRequest<ProfileDto>(`${PRODUCT_BASE[product]}/${id}`, { token });
}

export function requestProfileCreate(
  token: string,
  input: ProfileWriteInput,
  product: Product = 'ERP',
): Promise<ApiResult<ProfileDto>> {
  return apiRequest<ProfileDto>(PRODUCT_BASE[product], { method: 'POST', token, body: input });
}

export function requestProfileUpdate(
  token: string,
  id: number,
  input: ProfileWriteInput,
  product: Product = 'ERP',
): Promise<ApiResult<ProfileDto>> {
  return apiRequest<ProfileDto>(`${PRODUCT_BASE[product]}/${id}`, {
    method: 'PUT',
    token,
    body: input,
  });
}

export function requestProfileDelete(
  token: string,
  id: number,
  product: Product = 'ERP',
): Promise<ApiResult<{ message: string }>> {
  return apiRequest<{ message: string }>(`${PRODUCT_BASE[product]}/${id}`, {
    method: 'DELETE',
    token,
  });
}

/** A new, ordinary profile with the source's description and permissions, named "<name> (copy)". */
export function requestProfileDuplicate(
  token: string,
  id: number,
  product: Product = 'ERP',
): Promise<ApiResult<ProfileDto>> {
  return apiRequest<ProfileDto>(`${PRODUCT_BASE[product]}/${id}/duplicate`, {
    method: 'POST',
    token,
  });
}
