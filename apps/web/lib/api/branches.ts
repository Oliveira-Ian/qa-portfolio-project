import 'server-only';

import type { BranchDto, BranchWriteInput } from '@oliveira/schemas';
import { apiRequest, type ApiResult } from './client';

const BASE = '/api/company/branches';

/** The caller's company's branches — any member may read them. */
export function requestBranches(token: string, search?: string): Promise<ApiResult<BranchDto[]>> {
  return apiRequest<BranchDto[]>(BASE, { token, query: { search } });
}

/** Company admins only. */
export function requestCreateBranch(
  token: string,
  input: BranchWriteInput,
): Promise<ApiResult<BranchDto>> {
  return apiRequest<BranchDto>(BASE, { method: 'POST', token, body: input });
}

/** Company admins only. Deactivating is an update (`active: false`); branches are never deleted. */
export function requestUpdateBranch(
  token: string,
  id: string,
  input: BranchWriteInput,
): Promise<ApiResult<BranchDto>> {
  return apiRequest<BranchDto>(`${BASE}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    token,
    body: input,
  });
}
