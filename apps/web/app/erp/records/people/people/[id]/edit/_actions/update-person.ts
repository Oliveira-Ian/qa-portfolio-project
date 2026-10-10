'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  personFormSchema,
  personFormValuesToPayload,
  type PersonFormValues,
} from '@oliveira/schemas';
import { requestPersonUpdate } from '@/lib/api/persons';
import type { ActionResult } from '@/lib/actions';
import { ROUTES } from '@/lib/navigation/routes';
import { requireSession } from '@/lib/session';

export async function updatePersonAction(
  id: string,
  values: PersonFormValues,
): Promise<ActionResult> {
  const { token } = await requireSession();
  const parsed = personFormSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid data' };
  }

  const result = await requestPersonUpdate(token, id, personFormValuesToPayload(parsed.data));

  if (!result.success) {
    return { success: false, message: result.error };
  }

  // Both the list and this record's own pages hold a copy of what changed.
  revalidatePath(ROUTES.people.list);
  revalidatePath(ROUTES.people.view(id));
  redirect(ROUTES.people.list);
}
