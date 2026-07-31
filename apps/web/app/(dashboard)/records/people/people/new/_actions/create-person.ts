'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  personFormSchema,
  personFormValuesToPayload,
  type PersonFormValues,
} from '@oliveira/schemas';
import { requestPersonCreate } from '@/lib/api/persons';
import type { ActionResult } from '@/lib/actions';
import { ROUTES } from '@/lib/navigation/routes';
import { requireSession } from '@/lib/session';

export async function createPersonAction(values: PersonFormValues): Promise<ActionResult> {
  const { token } = await requireSession();
  const parsed = personFormSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid data' };
  }

  const result = await requestPersonCreate(token, personFormValuesToPayload(parsed.data));

  if (!result.success) {
    return { success: false, message: result.error };
  }

  revalidatePath(ROUTES.people.list);
  redirect(ROUTES.people.list);
}
