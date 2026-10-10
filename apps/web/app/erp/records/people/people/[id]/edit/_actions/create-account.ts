'use server';

import { revalidatePath } from 'next/cache';
import { accountCreateSchema } from '@oliveira/schemas';
import { requestAccountCreate } from '@/lib/api/accounts';
import type { ActionResult } from '@/lib/actions';
import { ROUTES } from '@/lib/navigation/routes';
import { requireSession } from '@/lib/session';

export async function createAccountAction(
  personId: string,
  values: { email: string; password: string },
): Promise<ActionResult> {
  const { token } = await requireSession();
  const parsed = accountCreateSchema.safeParse({ personId, ...values });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid data' };
  }

  const result = await requestAccountCreate(token, parsed.data);

  if (!result.success) {
    return { success: false, message: result.error };
  }

  revalidatePath(ROUTES.people.view(personId));
  revalidatePath(ROUTES.people.edit(personId));

  return { success: true };
}
