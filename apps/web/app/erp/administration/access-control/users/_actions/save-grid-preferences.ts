'use server';

import type { GridColumnPreferenceItem } from '@oliveira/schemas';
import type { ActionResult } from '@/lib/actions';
import { createGridPreferenceAccess } from '@/lib/grid-preferences';
import { ACCOUNT_GRID_KEY } from '../_data-access/get-grid-preferences';

const { savePreference } = createGridPreferenceAccess(ACCOUNT_GRID_KEY);

export async function saveAccountGridPreferenceAction(
  columns: GridColumnPreferenceItem[],
): Promise<ActionResult> {
  return savePreference(columns);
}
