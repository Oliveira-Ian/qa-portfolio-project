'use server';

import { revalidatePath } from 'next/cache';
import type { AccountRole } from '@oliveira/schemas';
import { requestAccountUpdate } from '@/lib/api/accounts';
import type { ActionResult } from '@/lib/actions';
import { ROUTES } from '@/lib/navigation/routes';
import { requireSession } from '@/lib/session';

export async function updateAccountAction(
  id: number,
  patch: { active?: boolean; role?: AccountRole },
): Promise<ActionResult> {
  const { token } = await requireSession();
  const result = await requestAccountUpdate(token, id, patch);

  if (!result.success) {
    return { success: false, message: result.error };
  }

  revalidatePath(ROUTES.accounts.list);

  return { success: true };
}
