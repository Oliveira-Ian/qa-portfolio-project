'use server';

import { revalidatePath } from 'next/cache';
import {
  accountProfileFormSchema,
  accountProfileFormToPayload,
  type AccountProfileFormValues,
} from '@oliveira/schemas';
import type { ActionResult } from '@/lib/actions';
import { requestAccountSetProfile } from '@/lib/api/accounts';
import { ROUTES } from '@/lib/navigation/routes';
import { requireSession } from '@/lib/session';

/** Sets the member's one ERP profile (or none). */
export async function setErpProfileAction(
  accountId: number,
  values: AccountProfileFormValues,
): Promise<ActionResult> {
  const parsed = accountProfileFormSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, message: 'Invalid data' };
  }

  const { token } = await requireSession();
  const { profileId } = accountProfileFormToPayload(parsed.data);
  const result = await requestAccountSetProfile(token, accountId, profileId, 'ERP');

  if (!result.success) {
    return { success: false, message: result.error, field: 'profileId' };
  }

  revalidatePath(ROUTES.accounts.list, 'layout');

  return { success: true };
}
