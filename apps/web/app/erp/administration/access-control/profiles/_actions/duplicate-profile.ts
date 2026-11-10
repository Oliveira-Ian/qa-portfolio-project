'use server';

import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/lib/actions';
import { requestProfileDuplicate } from '@/lib/api/profiles';
import { ROUTES } from '@/lib/navigation/routes';
import { requireSession } from '@/lib/session';

/** Copies a profile; the copy's id comes back so the screen can open it for editing. */
export async function duplicateProfileAction(id: number): Promise<ActionResult & { id?: number }> {
  const { token } = await requireSession();
  const result = await requestProfileDuplicate(token, id);

  if (!result.success) {
    return { success: false, message: result.error };
  }

  revalidatePath(ROUTES.profiles.list);

  return { success: true, id: result.data.id };
}
