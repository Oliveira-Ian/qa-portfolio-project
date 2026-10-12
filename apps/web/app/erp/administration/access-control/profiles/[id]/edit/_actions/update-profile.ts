'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { profileWriteSchema, type ProfileWriteInput } from '@oliveira/schemas';
import { requestProfileUpdate } from '@/lib/api/profiles';
import type { ActionResult } from '@/lib/actions';
import { ROUTES } from '@/lib/navigation/routes';
import { requireSession } from '@/lib/session';

export async function updateProfileAction(
  id: number,
  values: ProfileWriteInput,
): Promise<ActionResult> {
  const { token } = await requireSession();
  const parsed = profileWriteSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid data' };
  }

  const result = await requestProfileUpdate(token, id, parsed.data);

  if (!result.success) {
    // Only a repeated name belongs to the Name field: a 409 can also be the last-manager guard.
    return {
      success: false,
      message: result.error,
      ...(result.status === 409 && result.error === 'A profile with this name already exists'
        ? { field: 'name' }
        : {}),
    };
  }

  revalidatePath(ROUTES.profiles.list);
  redirect(ROUTES.profiles.list);
}
