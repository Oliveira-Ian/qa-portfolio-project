'use server';

import { revalidatePath } from 'next/cache';
import { requestAccountLinkProfile, requestAccountUnlinkProfile } from '@/lib/api/accounts';
import type { ActionResult } from '@/lib/actions';
import { ROUTES } from '@/lib/navigation/routes';
import { requireSession } from '@/lib/session';

export async function linkProfileAction(
  accountId: number,
  profileId: number,
): Promise<ActionResult> {
  const { token } = await requireSession();
  const result = await requestAccountLinkProfile(token, accountId, profileId);

  if (!result.success) {
    return { success: false, message: result.error };
  }

  revalidatePath(ROUTES.accounts.list);

  return { success: true };
}

export async function unlinkProfileAction(
  accountId: number,
  profileId: number,
): Promise<ActionResult> {
  const { token } = await requireSession();
  const result = await requestAccountUnlinkProfile(token, accountId, profileId);

  if (!result.success) {
    return { success: false, message: result.error };
  }

  revalidatePath(ROUTES.accounts.list);

  return { success: true };
}
