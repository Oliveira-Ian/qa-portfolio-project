'use server';

import type { CatalogItemFormValues, GridColumnPreferenceItem } from '@oliveira/schemas';
import type { ActionResult } from '@/lib/actions';
import { catalogItemAccess, catalogItemGrid } from '../_data-access/catalog-item-access';

/** Creates the item, or updates it when `id` is given. */
export async function saveCatalogItemAction(
  values: CatalogItemFormValues,
  id?: string,
): Promise<ActionResult & { id?: string }> {
  return catalogItemAccess.save(values, id);
}

/** All or nothing: one item in use and none is deleted. */
export async function deleteCatalogItemsAction(ids: string[]): Promise<ActionResult> {
  return catalogItemAccess.deleteMany(ids);
}

export async function saveCatalogItemGridAction(
  columns: GridColumnPreferenceItem[],
): Promise<ActionResult> {
  return catalogItemGrid.savePreference(columns);
}
