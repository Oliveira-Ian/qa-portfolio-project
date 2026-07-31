import 'server-only';

import type { Person, PersonCreateInput, PersonQuery } from '@oliveira/schemas';
import { apiRequest, type ApiResult } from './client';
import type { MessageResponse } from './auth';

const BASE = '/api/persons';

export function requestPersonList(
  token: string,
  query: PersonQuery = {},
): Promise<ApiResult<Person[]>> {
  return apiRequest<Person[]>(BASE, {
    token,
    query: {
      type: query.type,
      active: query.active === undefined ? undefined : String(query.active),
      search: query.search,
    },
  });
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
