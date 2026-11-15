import 'server-only';

import type {
  CompanyMemberDto,
  CompanyMembersDto,
  MemberAddInput,
  MemberUpdateInput,
  Product,
  SeatChangeDto,
} from '@oliveira/schemas';
import { apiRequest, type ApiResult } from './client';
import type { MessageResponse } from './auth';

const BASE = '/api/company/members';

/** Members of the caller's company, with the contracts their seats count against. Company admins only. */
export function requestCompanyMembers(token: string): Promise<ApiResult<CompanyMembersDto>> {
  return apiRequest<CompanyMembersDto>(BASE, { token });
}

/** Always answers with the same generic message, whether or not the address had an account. */
export function requestAddMember(
  token: string,
  input: MemberAddInput,
): Promise<ApiResult<MessageResponse>> {
  return apiRequest<MessageResponse>(BASE, { method: 'POST', token, body: input });
}

export function requestUpdateMember(
  token: string,
  membershipId: string,
  input: MemberUpdateInput,
): Promise<ApiResult<CompanyMemberDto>> {
  return apiRequest<CompanyMemberDto>(`${BASE}/${membershipId}`, {
    method: 'PATCH',
    token,
    body: input,
  });
}

export function requestGrantSeat(
  token: string,
  membershipId: string,
  product: Product,
): Promise<ApiResult<SeatChangeDto>> {
  return apiRequest<SeatChangeDto>(`${BASE}/${membershipId}/products/${product}`, {
    method: 'PUT',
    token,
  });
}

export function requestRevokeSeat(
  token: string,
  membershipId: string,
  product: Product,
): Promise<ApiResult<SeatChangeDto>> {
  return apiRequest<SeatChangeDto>(`${BASE}/${membershipId}/products/${product}`, {
    method: 'DELETE',
    token,
  });
}

/** One member's seat in one product, as the UI wants it after saving. */
export interface SeatChange {
  membershipId: string;
  product: Product;
  granted: boolean;
}

/**
 * Applies seat changes in an order that cannot trip the limit needlessly:
 * **revocations first**, then grants, so that taking a seat from one member and
 * giving it to another in the same save works at the limit. It stops at the
 * first refusal (a licence limit, say) and reports it; what was applied before
 * stays applied, and the caller refreshes so the screen shows the truth.
 */
export async function applySeatChanges(
  token: string,
  changes: readonly SeatChange[],
): Promise<{ success: true } | { success: false; error: string }> {
  const ordered = [
    ...changes.filter((change) => !change.granted),
    ...changes.filter((change) => change.granted),
  ];

  for (const change of ordered) {
    const result = change.granted
      ? await requestGrantSeat(token, change.membershipId, change.product)
      : await requestRevokeSeat(token, change.membershipId, change.product);

    if (!result.success) {
      return { success: false, error: result.error };
    }
  }

  return { success: true };
}
