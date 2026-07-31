'use server';

import type { GridColumnPreferenceItem } from '@oliveira/schemas';
import { requestGridPreferenceSave } from '@/lib/api/grid-preferences';
import type { ActionResult } from '@/lib/actions';
import { requireSession } from '@/lib/session';
import { ACCOUNT_GRID_KEY } from '../_data-access/get-grid-preferences';

export async function saveAccountGridPreferenceAction(
  columns: GridColumnPreferenceItem[],
): Promise<ActionResult> {
  const { token } = await requireSession();
  const result = await requestGridPreferenceSave(token, ACCOUNT_GRID_KEY, { columns });

  if (!result.success) {
    return { success: false, message: result.error };
  }

  return { success: true };
}
