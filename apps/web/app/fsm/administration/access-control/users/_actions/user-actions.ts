'use server';

import { revalidatePath } from 'next/cache';
import {
  accountProfileFormSchema,
  accountProfileFormToPayload,
  type AccountProfileFormValues,
  type GridColumnPreferenceItem,
} from '@oliveira/schemas';
import type { ActionResult } from '@/lib/actions';
import { requestAccountSetProfile } from '@/lib/api/accounts';
import { ROUTES } from '@/lib/navigation/routes';
import { requireSession } from '@/lib/session';
import { fsmAccountGrid } from '../_data-access/user-access';

/** Sets the member's one FSM profile (or none). */
export async function setFsmProfileAction(
  accountId: number,
  values: AccountProfileFormValues,
): Promise<ActionResult> {
  const parsed = accountProfileFormSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, message: 'Invalid data' };
  }

  const { token } = await requireSession();
  const { profileId } = accountProfileFormToPayload(parsed.data);
  const result = await requestAccountSetProfile(token, accountId, profileId, 'FSM');

  if (!result.success) {
    return { success: false, message: result.error, field: 'profileId' };
  }

  revalidatePath(ROUTES.fsm.users.list, 'layout');

  return { success: true };
}

export async function saveFsmAccountGridAction(
  columns: GridColumnPreferenceItem[],
): Promise<ActionResult> {
  return fsmAccountGrid.savePreference(columns);
}
