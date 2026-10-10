'use server';

import type { GridColumnPreferenceItem } from '@oliveira/schemas';
import type { ActionResult } from '@/lib/actions';
import { createGridPreferenceAccess } from '@/lib/grid-preferences';
import { PERSON_GRID_KEY } from '../_data-access/get-grid-preferences';

const { savePreference } = createGridPreferenceAccess(PERSON_GRID_KEY);

export async function savePersonGridPreferenceAction(
  columns: GridColumnPreferenceItem[],
): Promise<ActionResult> {
  return savePreference(columns);
}
