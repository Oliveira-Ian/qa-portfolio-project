'use server';

import type { GridColumnPreferenceItem, PersonFormValues } from '@oliveira/schemas';
import type { ActionResult } from '@/lib/actions';
import { customerAccess, customerGrid } from '../_data-access/customer-access';

/** Creates the customer — its person, addresses and contacts — or updates it when `id` is given. */
export async function saveCustomerAction(
  values: PersonFormValues,
  id?: string,
): Promise<ActionResult & { id?: string }> {
  return customerAccess.save(values, id);
}

/** All or nothing: one customer with equipment and none is deleted. */
export async function deleteCustomersAction(ids: string[]): Promise<ActionResult> {
  return customerAccess.deleteMany(ids);
}

export async function saveCustomerGridAction(
  columns: GridColumnPreferenceItem[],
): Promise<ActionResult> {
  return customerGrid.savePreference(columns);
}
