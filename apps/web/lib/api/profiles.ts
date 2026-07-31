import 'server-only';

import type { PaginatedResult, ProfileDto, ProfileWriteInput } from '@oliveira/schemas';
import { serializeListQuery, type ListQueryState } from '@/lib/list-query';
import { apiRequest, type ApiResult } from './client';

const BASE = '/api/profiles';

export function requestProfileList(
  token: string,
  query: ListQueryState,
): Promise<ApiResult<PaginatedResult<ProfileDto>>> {
  return apiRequest<PaginatedResult<ProfileDto>>(BASE, {
    token,
    query: Object.fromEntries(new URLSearchParams(serializeListQuery(query))),
  });
}

export function requestProfile(token: string, id: number): Promise<ApiResult<ProfileDto>> {
  return apiRequest<ProfileDto>(`${BASE}/${id}`, { token });
}

export function requestProfileCreate(
  token: string,
  input: ProfileWriteInput,
): Promise<ApiResult<ProfileDto>> {
  return apiRequest<ProfileDto>(BASE, { method: 'POST', token, body: input });
}

export function requestProfileUpdate(
  token: string,
  id: number,
  input: ProfileWriteInput,
): Promise<ApiResult<ProfileDto>> {
  return apiRequest<ProfileDto>(`${BASE}/${id}`, { method: 'PUT', token, body: input });
}

export function requestProfileDelete(
  token: string,
  id: number,
): Promise<ApiResult<{ message: string }>> {
  return apiRequest<{ message: string }>(`${BASE}/${id}`, { method: 'DELETE', token });
}
