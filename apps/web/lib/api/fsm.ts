import 'server-only';

import type {
  BranchDto,
  BranchWriteInput,
  CatalogItemDto,
  CatalogItemWriteInput,
  CustomerDto,
  CustomerOptionDto,
  CustomerPersonWriteInput,
  EquipmentDto,
  EquipmentWriteInput,
  FsmDashboardDto,
  PaginatedResult,
  TechnicianDto,
  WorkOrderDto,
  WorkOrderItemWriteInput,
  WorkOrderListItemDto,
  WorkOrderRequest,
  WorkOrderStatusChange,
  WorkOrderTypeDto,
  WorkOrderTypeWriteInput,
} from '@oliveira/schemas';
import { serializeListQuery, type ListQueryState } from '@/lib/list-query';
import { apiRequest, type ApiResult } from './client';
import type { MessageResponse } from './auth';

/**
 * Oliveira FSM's records, all with the same five endpoints under `/api/fsm/…`
 * (`apps/api/src/modules/fsm/crud-routes.ts`): one client per record, built
 * by the same function so they can't drift apart.
 */
export interface RecordApi<TDto, TWrite> {
  list(
    token: string,
    query: ListQueryState,
    extra?: Record<string, string>,
  ): Promise<ApiResult<PaginatedResult<TDto>>>;
  get(token: string, id: string): Promise<ApiResult<TDto>>;
  create(token: string, input: TWrite): Promise<ApiResult<TDto>>;
  update(token: string, id: string, input: TWrite): Promise<ApiResult<TDto>>;
  deleteMany(token: string, ids: string[]): Promise<ApiResult<MessageResponse>>;
}

function recordApi<TDto, TWrite>(base: string): RecordApi<TDto, TWrite> {
  return {
    list: (token, query, extra = {}) =>
      apiRequest<PaginatedResult<TDto>>(base, {
        token,
        query: { ...Object.fromEntries(new URLSearchParams(serializeListQuery(query))), ...extra },
      }),
    get: (token, id) => apiRequest<TDto>(`${base}/${encodeURIComponent(id)}`, { token }),
    create: (token, input) => apiRequest<TDto>(base, { method: 'POST', token, body: input }),
    update: (token, id, input) =>
      apiRequest<TDto>(`${base}/${encodeURIComponent(id)}`, { method: 'PUT', token, body: input }),
    deleteMany: (token, ids) =>
      apiRequest<MessageResponse>(base, { method: 'DELETE', token, body: { ids } }),
  };
}

export const customersApi = recordApi<CustomerDto, CustomerPersonWriteInput>('/api/fsm/customers');
export const equipmentApi = recordApi<EquipmentDto, EquipmentWriteInput>('/api/fsm/equipment');
export const catalogItemsApi = recordApi<CatalogItemDto, CatalogItemWriteInput>(
  '/api/fsm/catalog-items',
);
export const workOrderTypesApi = recordApi<WorkOrderTypeDto, WorkOrderTypeWriteInput>(
  '/api/fsm/work-order-types',
);

/** Active customers matching `search`, with their addresses — for another record's form. */
export function requestCustomerOptions(
  token: string,
  filter: { search?: string; id?: string } = {},
): Promise<ApiResult<CustomerOptionDto[]>> {
  return apiRequest<CustomerOptionDto[]>('/api/fsm/customers/options', {
    token,
    query: { search: filter.search, id: filter.id },
  });
}

/** The company's branches, as the FSM manages them (docs/adr/0013, addendum). */
export const branchesApi = recordApi<BranchDto, BranchWriteInput>('/api/fsm/branches');

/** Every active branch — what a work order's form offers. */
export function requestBranchOptions(token: string): Promise<ApiResult<BranchDto[]>> {
  return apiRequest<BranchDto[]>('/api/fsm/branches/options', { token });
}

/* Work orders (`/api/fsm/work-orders`). */

const WORK_ORDERS = '/api/fsm/work-orders';
const workOrderPath = (id: string) => `${WORK_ORDERS}/${encodeURIComponent(id)}`;

export function requestWorkOrderList(
  token: string,
  query: ListQueryState,
  extra: Record<string, string> = {},
): Promise<ApiResult<PaginatedResult<WorkOrderListItemDto>>> {
  return apiRequest<PaginatedResult<WorkOrderListItemDto>>(WORK_ORDERS, {
    token,
    query: { ...Object.fromEntries(new URLSearchParams(serializeListQuery(query))), ...extra },
  });
}

export function requestWorkOrder(token: string, id: string): Promise<ApiResult<WorkOrderDto>> {
  return apiRequest<WorkOrderDto>(workOrderPath(id), { token });
}

export function requestTechnicians(token: string): Promise<ApiResult<TechnicianDto[]>> {
  return apiRequest<TechnicianDto[]>(`${WORK_ORDERS}/technicians`, { token });
}

export function requestWorkOrderSave(
  token: string,
  body: WorkOrderRequest,
  id?: string,
): Promise<ApiResult<WorkOrderDto>> {
  return id
    ? apiRequest<WorkOrderDto>(workOrderPath(id), { method: 'PUT', token, body })
    : apiRequest<WorkOrderDto>(WORK_ORDERS, { method: 'POST', token, body });
}

export function requestWorkOrderStatus(
  token: string,
  id: string,
  change: WorkOrderStatusChange,
): Promise<ApiResult<WorkOrderDto>> {
  return apiRequest<WorkOrderDto>(`${workOrderPath(id)}/status`, {
    method: 'POST',
    token,
    body: change,
  });
}

export function requestWorkOrderNote(
  token: string,
  id: string,
  message: string,
): Promise<ApiResult<WorkOrderDto>> {
  return apiRequest<WorkOrderDto>(`${workOrderPath(id)}/notes`, {
    method: 'POST',
    token,
    body: { message },
  });
}

export function requestWorkOrderItemAdd(
  token: string,
  id: string,
  input: WorkOrderItemWriteInput,
): Promise<ApiResult<WorkOrderDto>> {
  return apiRequest<WorkOrderDto>(`${workOrderPath(id)}/items`, {
    method: 'POST',
    token,
    body: input,
  });
}

export function requestWorkOrderItemRemove(
  token: string,
  id: string,
  itemId: string,
): Promise<ApiResult<WorkOrderDto>> {
  return apiRequest<WorkOrderDto>(`${workOrderPath(id)}/items/${encodeURIComponent(itemId)}`, {
    method: 'DELETE',
    token,
  });
}

/** The operation at a glance (`dashboard:view`). */
export function requestFsmDashboard(token: string): Promise<ApiResult<FsmDashboardDto>> {
  return apiRequest<FsmDashboardDto>('/api/fsm/dashboard', { token });
}
