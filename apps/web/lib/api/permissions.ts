import 'server-only';

import type { PermissionDto } from '@oliveira/schemas';
import { apiRequest, type ApiResult } from './client';

export function requestPermissionList(token: string): Promise<ApiResult<PermissionDto[]>> {
  return apiRequest<PermissionDto[]>('/api/permissions', { token });
}
