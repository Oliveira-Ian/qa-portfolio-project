'use server';

import type { GridColumnPreferenceItem } from '@oliveira/schemas';
import type { ActionResult } from '@/lib/actions';
import { createGridPreferenceAccess } from '@/lib/grid-preferences';
import { PROFILE_GRID_KEY } from '../_data-access/get-grid-preferences';

const { savePreference } = createGridPreferenceAccess(PROFILE_GRID_KEY);

export async function saveProfileGridPreferenceAction(
  columns: GridColumnPreferenceItem[],
): Promise<ActionResult> {
  return savePreference(columns);
}
