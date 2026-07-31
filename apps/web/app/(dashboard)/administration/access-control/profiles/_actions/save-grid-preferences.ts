'use server';

import type { GridColumnPreferenceItem } from '@oliveira/schemas';
import { requestGridPreferenceSave } from '@/lib/api/grid-preferences';
import type { ActionResult } from '@/lib/actions';
import { requireSession } from '@/lib/session';
import { PROFILE_GRID_KEY } from '../_data-access/get-grid-preferences';

export async function saveProfileGridPreferenceAction(
  columns: GridColumnPreferenceItem[],
): Promise<ActionResult> {
  const { token } = await requireSession();
  const result = await requestGridPreferenceSave(token, PROFILE_GRID_KEY, { columns });

  if (!result.success) {
    return { success: false, message: result.error };
  }

  return { success: true };
}
