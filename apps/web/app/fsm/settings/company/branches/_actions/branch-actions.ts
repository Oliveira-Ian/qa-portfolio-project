'use server';

import type { BranchFormValues, GridColumnPreferenceItem } from '@oliveira/schemas';
import type { ActionResult } from '@/lib/actions';
import { branchAccess, branchGrid } from '../_data-access/branch-access';

/** Creates the branch, or updates it when `id` is given. */
export async function saveBranchAction(
  values: BranchFormValues,
  id?: string,
): Promise<ActionResult & { id?: string }> {
  return branchAccess.save(values, id);
}

/** All or nothing: one branch in use and none is deleted. */
export async function deleteBranchesAction(ids: string[]): Promise<ActionResult> {
  return branchAccess.deleteMany(ids);
}

export async function saveBranchGridAction(
  columns: GridColumnPreferenceItem[],
): Promise<ActionResult> {
  return branchGrid.savePreference(columns);
}
