'use server';

import type {
  CustomerOptionDto,
  EquipmentFormValues,
  GridColumnPreferenceItem,
} from '@oliveira/schemas';
import type { ActionResult } from '@/lib/actions';
import { getCustomerOptions } from '../_data-access/customer-options';
import { equipmentAccess, equipmentGrid } from '../_data-access/equipment-access';

/** Creates the equipment, or updates it when `id` is given. */
export async function saveEquipmentAction(
  values: EquipmentFormValues,
  id?: string,
): Promise<ActionResult & { id?: string }> {
  return equipmentAccess.save(values, id);
}

/** All or nothing: one item with work orders and none is deleted. */
export async function deleteEquipmentAction(ids: string[]): Promise<ActionResult> {
  return equipmentAccess.deleteMany(ids);
}

export async function saveEquipmentGridAction(
  columns: GridColumnPreferenceItem[],
): Promise<ActionResult> {
  return equipmentGrid.savePreference(columns);
}

/** The customer picker's search — the API checks the caller may see them. */
export async function searchCustomerOptionsAction(search: string): Promise<CustomerOptionDto[]> {
  return getCustomerOptions(search);
}
