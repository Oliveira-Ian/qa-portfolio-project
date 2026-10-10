'use server';

import { revalidatePath } from 'next/cache';
import { requestProfileDelete } from '@/lib/api/profiles';
import type { ActionResult } from '@/lib/actions';
import { ROUTES } from '@/lib/navigation/routes';
import { requireSession } from '@/lib/session';

/**
 * Accepts one or many ids — the grid's selection is a free multi-select, same
 * as People. Loops the existing single-record `DELETE /api/profiles/:id`
 * rather than adding a bulk endpoint, so the documented HTTP contract stays
 * unchanged (see `_actions/delete-persons.ts`, the pattern this mirrors). The
 * first failure stops the loop and is reported — a `isSystem` profile in the
 * selection reports its 409 and leaves anything already deleted before it
 * deleted, no rollback, same as `delete-persons.ts`.
 */
export async function deleteProfileAction(ids: number[]): Promise<ActionResult> {
  const { token } = await requireSession();

  for (const id of ids) {
    const result = await requestProfileDelete(token, id);

    if (!result.success) {
      return { success: false, message: result.error };
    }
  }

  revalidatePath(ROUTES.profiles.list);

  return {
    success: true,
    message: ids.length === 1 ? 'Profile deleted' : `${ids.length} profiles deleted`,
  };
}
