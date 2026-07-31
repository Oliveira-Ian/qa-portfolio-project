import 'server-only';

import type { GridColumnPreferenceDto, GridColumnPreferenceSaveInput } from '@oliveira/schemas';
import { apiRequest, type ApiResult } from './client';

const BASE = '/api/grid-preferences';

export function requestGridPreference(
  token: string,
  gridKey: string,
): Promise<ApiResult<GridColumnPreferenceDto | null>> {
  return apiRequest<GridColumnPreferenceDto | null>(`${BASE}/${gridKey}`, { token });
}

export function requestGridPreferenceSave(
  token: string,
  gridKey: string,
  input: GridColumnPreferenceSaveInput,
): Promise<ApiResult<GridColumnPreferenceDto>> {
  return apiRequest<GridColumnPreferenceDto>(`${BASE}/${gridKey}`, {
    method: 'PUT',
    token,
    body: input,
  });
}
