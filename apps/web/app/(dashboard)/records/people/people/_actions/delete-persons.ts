'use server';

import { revalidatePath } from 'next/cache';
import { requestPersonDelete } from '@/lib/api/persons';
import type { ActionResult } from '@/lib/actions';
import { ROUTES } from '@/lib/navigation/routes';
import { requireSession } from '@/lib/session';

/**
 * Accepts one or many ids — the spec allows deleting several selected
 * records at once. Loops the existing single-record `DELETE /api/persons/:id`
 * rather than adding a bulk endpoint, so the documented HTTP contract stays
 * unchanged. The first failure stops the loop and is reported; anything
 * already deleted before that stays deleted (no rollback, same as any other
 * multi-request action in this app).
 */
export async function deletePersonsAction(ids: string[]): Promise<ActionResult> {
  const { token } = await requireSession();

  for (const id of ids) {
    const result = await requestPersonDelete(token, id);

    if (!result.success) {
      return { success: false, message: result.error };
    }
  }

  // Drops the cached list so the row(s) are gone the moment the router refreshes.
  revalidatePath(ROUTES.people.list);

  return {
    success: true,
    message: ids.length === 1 ? 'Person deleted' : `${ids.length} people deleted`,
  };
}
