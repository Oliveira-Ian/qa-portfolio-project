import 'server-only';

import type { PermissionDto, Product } from '@oliveira/schemas';
import { apiRequest, type ApiResult } from './client';

/** Each product's catalog under its own prefix; the ERP keeps the historical one. */
const PRODUCT_BASE: Record<Product, string> = {
  ERP: '/api/permissions',
  FSM: '/api/fsm/permissions',
};

/** The product's permission catalog — what its profile editor offers. */
export function requestPermissionList(
  token: string,
  product: Product = 'ERP',
): Promise<ApiResult<PermissionDto[]>> {
  return apiRequest<PermissionDto[]>(PRODUCT_BASE[product], { token });
}
