import 'server-only';

import type {
  PaginatedResult,
  Person,
  PersonCreateInput,
  PersonSummaryDto,
} from '@oliveira/schemas';
import { serializeListQuery, type ListQueryState } from '@/lib/list-query';
import { apiRequest, type ApiResult } from './client';
import type { MessageResponse } from './auth';

const BASE = '/api/persons';

/**
 * `query.search` maps straight onto the API's own `search` param (name/
 * document `contains`) — `serializeListQuery` already names it that way, so
 * no translation happens here beyond turning the querystring it builds into
 * the plain record `apiRequest` wants.
 */
export function requestPersonList(
  token: string,
  query: ListQueryState,
): Promise<ApiResult<PaginatedResult<Person>>> {
  return apiRequest<PaginatedResult<Person>>(BASE, {
    token,
    query: Object.fromEntries(new URLSearchParams(serializeListQuery(query))),
  });
}

export function requestPersonSummary(token: string): Promise<ApiResult<PersonSummaryDto>> {
  return apiRequest<PersonSummaryDto>(`${BASE}/summary`, { token });
}

export function requestPerson(token: string, id: string): Promise<ApiResult<Person>> {
  return apiRequest<Person>(`${BASE}/${id}`, { token });
}

export function requestPersonCreate(
  token: string,
  input: PersonCreateInput,
): Promise<ApiResult<MessageResponse>> {
  return apiRequest<MessageResponse>(BASE, { method: 'POST', token, body: input });
}

export function requestPersonUpdate(
  token: string,
  id: string,
  input: PersonCreateInput,
): Promise<ApiResult<MessageResponse>> {
  return apiRequest<MessageResponse>(`${BASE}/${id}`, { method: 'PUT', token, body: input });
}

export function requestPersonDelete(
  token: string,
  id: string,
): Promise<ApiResult<MessageResponse>> {
  return apiRequest<MessageResponse>(`${BASE}/${id}`, { method: 'DELETE', token });
}

/** One request, one transaction on the API side — see `person.repository.ts#deleteMany`. */
export function requestPersonDeleteMany(
  token: string,
  ids: string[],
): Promise<ApiResult<MessageResponse>> {
  return apiRequest<MessageResponse>(BASE, { method: 'DELETE', token, body: { ids } });
}
