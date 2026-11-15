'use server';

import { revalidatePath } from 'next/cache';
import {
  businessUtcOffsetMinutes,
  workOrderItemWriteSchema,
  workOrderNoteSchema,
  workOrderStatusChangeSchema,
  workOrderWriteSchema,
  type CustomerOptionDto,
  type EquipmentCriticality,
  type GridColumnPreferenceItem,
  type WorkOrderFormValues,
  type WorkOrderItemWriteInput,
  type WorkOrderStatusChange,
} from '@oliveira/schemas';
import type { ActionResult } from '@/lib/actions';
import type { ApiResult } from '@/lib/api/client';
import {
  catalogItemsApi,
  equipmentApi,
  requestCustomerOptions,
  requestWorkOrderItemAdd,
  requestWorkOrderItemRemove,
  requestWorkOrderList,
  requestWorkOrderNote,
  requestWorkOrderSave,
  requestWorkOrderStatus,
} from '@/lib/api/fsm';
import { EMPTY_LIST_QUERY } from '@/lib/list-query';
import { ROUTES } from '@/lib/navigation/routes';
import { requireSession } from '@/lib/session';
import { workOrderGrid } from '../_data-access/work-order-access';

/** What every change answers: success (and the work order's id) or the API's message. */
function settle(result: ApiResult<{ id: string }>): ActionResult & { id?: string } {
  if (!result.success) {
    return { success: false, message: result.error };
  }

  revalidatePath(ROUTES.fsm.workOrders.list, 'layout');
  revalidatePath(ROUTES.fsm.myWorkOrders);

  return { success: true, id: result.data.id };
}

/** Opens the work order, or saves its details when `id` is given. */
export async function saveWorkOrderAction(
  values: WorkOrderFormValues,
  id?: string,
): Promise<ActionResult & { id?: string }> {
  const parsed = workOrderWriteSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid data' };
  }

  const { token } = await requireSession();

  return settle(
    await requestWorkOrderSave(
      token,
      { values: parsed.data, timezoneOffset: businessUtcOffsetMinutes() },
      id,
    ),
  );
}

export async function changeWorkOrderStatusAction(
  id: string,
  change: WorkOrderStatusChange,
): Promise<ActionResult> {
  const parsed = workOrderStatusChangeSchema.safeParse(change);

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid data' };
  }

  const { token } = await requireSession();

  return settle(await requestWorkOrderStatus(token, id, parsed.data));
}

export async function addWorkOrderNoteAction(id: string, message: string): Promise<ActionResult> {
  const parsed = workOrderNoteSchema.safeParse({ message });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid data' };
  }

  const { token } = await requireSession();

  return settle(await requestWorkOrderNote(token, id, parsed.data.message));
}

export async function addWorkOrderItemAction(
  id: string,
  input: WorkOrderItemWriteInput,
): Promise<ActionResult> {
  const parsed = workOrderItemWriteSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid data' };
  }

  const { token } = await requireSession();

  return settle(await requestWorkOrderItemAdd(token, id, parsed.data));
}

export async function removeWorkOrderItemAction(id: string, itemId: string): Promise<ActionResult> {
  const { token } = await requireSession();

  return settle(await requestWorkOrderItemRemove(token, id, itemId));
}

/** The customer picker's search. */
export async function searchWorkOrderCustomersAction(search: string): Promise<CustomerOptionDto[]> {
  const { token } = await requireSession();
  const result = await requestCustomerOptions(token, search ? { search } : {});

  return result.success ? result.data : [];
}

export interface EquipmentChoice {
  id: string;
  name: string;
  tag: string | null;
  addressId: string | null;
  manufacturer: string | null;
  model: string | null;
  criticality: EquipmentCriticality | null;
}

/** The chosen customer's equipment in service, for the equipment picker. */
export async function customerEquipmentAction(customerId: string): Promise<EquipmentChoice[]> {
  const { token } = await requireSession();
  const result = await equipmentApi.list(
    token,
    { ...EMPTY_LIST_QUERY, pageSize: 100 },
    { customerId, f_status: 'ACTIVE,UNDER_MAINTENANCE' },
  );

  return result.success
    ? result.data.items.map((item) => ({
        id: item.id,
        name: item.name,
        tag: item.tag,
        addressId: item.address?.id ?? null,
        manufacturer: item.manufacturer,
        model: item.model,
        criticality: item.criticality,
      }))
    : [];
}

export interface TechnicianDayJob {
  membershipId: string;
  scheduledAt: string;
}

/**
 * What is already scheduled on a day (`yyyy-mm-dd`), by technician — what the
 * schedule step shows beside each one. `exceptId`: the work order being edited.
 */
export async function technicianDayAction(
  day: string,
  exceptId?: string,
): Promise<TechnicianDayJob[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return [];
  }

  const { token } = await requireSession();
  const result = await requestWorkOrderList(
    token,
    { ...EMPTY_LIST_QUERY, pageSize: 100 },
    { f_scheduledAt_from: day, f_scheduledAt_to: day },
  );

  return result.success
    ? result.data.items.flatMap((item) =>
        item.assignee && item.scheduledAt && item.status !== 'CANCELLED' && item.id !== exceptId
          ? [{ membershipId: item.assignee.membershipId, scheduledAt: item.scheduledAt }]
          : [],
      )
    : [];
}

export interface CatalogChoice {
  id: string;
  name: string;
  code: string | null;
  unit: string;
}

/** Active products and services matching `search`, for the materials picker. */
export async function searchCatalogItemsAction(search: string): Promise<CatalogChoice[]> {
  const { token } = await requireSession();
  const result = await catalogItemsApi.list(
    token,
    { ...EMPTY_LIST_QUERY, pageSize: 20, search },
    { f_active: 'true' },
  );

  return result.success
    ? result.data.items.map((item) => ({
        id: item.id,
        name: item.name,
        code: item.code,
        unit: item.unit,
      }))
    : [];
}

export async function saveWorkOrderGridAction(
  columns: GridColumnPreferenceItem[],
): Promise<ActionResult> {
  return workOrderGrid.savePreference(columns);
}
