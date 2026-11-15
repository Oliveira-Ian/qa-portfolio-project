import 'server-only';

import { cache } from 'react';
import { notFound } from 'next/navigation';
import type {
  BranchDto,
  CustomerOptionDto,
  PaginatedResult,
  TechnicianDto,
  WorkOrderDto,
  WorkOrderListItemDto,
  WorkOrderTypeDto,
} from '@oliveira/schemas';
import { ApiError, unwrap } from '@/lib/api/client';
import {
  requestBranchOptions,
  requestCustomerOptions,
  requestTechnicians,
  requestWorkOrder,
  requestWorkOrderFilterOptions,
  requestWorkOrderList,
  workOrderTypesApi,
} from '@/lib/api/fsm';
import { createGridPreferenceAccess } from '@/lib/grid-preferences';
import { EMPTY_LIST_QUERY, type ListQueryState } from '@/lib/list-query';
import { requireSession } from '@/lib/session';
import {
  toWorkOrderFilterChoices,
  type WorkOrderFilterChoices,
} from '../_components/work-order-filters';

/** One page of work orders; `extra` carries `mine`, `overdue`, `customerId`… */
export const listWorkOrders = cache(
  async (
    query: ListQueryState,
    extra: Record<string, string> = {},
  ): Promise<PaginatedResult<WorkOrderListItemDto>> => {
    const { token } = await requireSession();

    return unwrap(await requestWorkOrderList(token, query, extra));
  },
);

/** One work order the caller may see — another's, or another company's, is Next's not-found page. */
export const getWorkOrder = cache(async (id: string): Promise<WorkOrderDto> => {
  const { token } = await requireSession();
  const result = await requestWorkOrder(token, id);

  if (!result.success) {
    if (result.status === 404) {
      notFound();
    }

    throw new ApiError(result.error, result.status);
  }

  return result.data;
});

export interface WorkOrderFormOptions {
  types: WorkOrderTypeDto[];
  branches: BranchDto[];
  technicians: TechnicianDto[];
}

/** What the work order form offers: active types, active branches and the technicians. */
export async function getWorkOrderFormOptions(): Promise<WorkOrderFormOptions> {
  const { token } = await requireSession();
  const [types, branches, technicians] = await Promise.all([
    workOrderTypesApi.list(token, { ...EMPTY_LIST_QUERY, pageSize: 100 }, { f_active: 'true' }),
    requestBranchOptions(token),
    requestTechnicians(token),
  ]);

  return {
    types: unwrap(types).items,
    branches: unwrap(branches),
    technicians: unwrap(technicians),
  };
}

/** The customer of a work order being edited, with its addresses. */
export async function getCustomerOption(id: string): Promise<CustomerOptionDto | null> {
  const { token } = await requireSession();

  return unwrap(await requestCustomerOptions(token, { id }))[0] ?? null;
}

/** The company's types, branches and technicians, to filter the list by. */
export async function getWorkOrderFilterChoices(): Promise<WorkOrderFilterChoices> {
  const { token } = await requireSession();

  return toWorkOrderFilterChoices(unwrap(await requestWorkOrderFilterOptions(token)));
}

export const workOrderGrid = createGridPreferenceAccess('fsm-work-order-list');
