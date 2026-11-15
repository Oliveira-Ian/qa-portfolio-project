'use server';

import type { GridColumnPreferenceItem, ProfileWriteInput } from '@oliveira/schemas';
import type { ActionResult } from '@/lib/actions';
import { profileAccess, profileGrid } from '../_data-access/profile-access';

/** Creates the profile, or updates it when `id` is given; the API checks `profile:manage`. */
export async function saveProfileAction(
  values: ProfileWriteInput,
  id?: number,
): Promise<ActionResult & { id?: string }> {
  return profileAccess.save(values, id);
}

/** Stops at the first refusal (a protected profile, the last manager). */
export async function deleteProfilesAction(ids: number[]): Promise<ActionResult> {
  return profileAccess.deleteMany(ids);
}

/** A new, ordinary profile with the source's description and permissions. */
export async function duplicateProfileAction(id: number): Promise<ActionResult & { id?: number }> {
  return profileAccess.duplicate(id);
}

export async function saveProfileGridAction(
  columns: GridColumnPreferenceItem[],
): Promise<ActionResult> {
  return profileGrid.savePreference(columns);
}
