'use server';

import type { GridColumnPreferenceItem, WorkOrderTypeFormValues } from '@oliveira/schemas';
import type { ActionResult } from '@/lib/actions';
import { workOrderTypeAccess, workOrderTypeGrid } from '../_data-access/work-order-type-access';

/** Creates the type, or updates it when `id` is given; the API checks `work-order-type:manage`. */
export async function saveWorkOrderTypeAction(
  values: WorkOrderTypeFormValues,
  id?: string,
): Promise<ActionResult & { id?: string }> {
  return workOrderTypeAccess.save(values, id);
}

/** All or nothing: one type in use and none is deleted. */
export async function deleteWorkOrderTypesAction(ids: string[]): Promise<ActionResult> {
  return workOrderTypeAccess.deleteMany(ids);
}

export async function saveWorkOrderTypeGridAction(
  columns: GridColumnPreferenceItem[],
): Promise<ActionResult> {
  return workOrderTypeGrid.savePreference(columns);
}
