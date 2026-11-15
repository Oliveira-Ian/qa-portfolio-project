'use server';

import { revalidatePath } from 'next/cache';
import { requestPersonDeleteMany } from '@/lib/api/persons';
import type { ActionResult } from '@/lib/actions';
import { ROUTES } from '@/lib/navigation/routes';
import { requireSession } from '@/lib/session';

/**
 * Accepts one or many ids — the spec allows deleting several selected
 * records at once. One request to `DELETE /api/persons`, which runs the
 * whole batch inside a single Prisma transaction: either every id is
 * deleted or none are, so a mid-batch failure (e.g. one of the selected
 * people still has a linked access account) never leaves the table in a
 * state where some rows are gone and others aren't with no way to tell
 * which.
 */
export async function deletePersonsAction(ids: string[]): Promise<ActionResult> {
  const { token } = await requireSession();

  const result = await requestPersonDeleteMany(token, ids);

  if (!result.success) {
    return { success: false, message: result.error };
  }

  // Drops the cached list so the row(s) are gone the moment the router refreshes.
  revalidatePath(ROUTES.people.list);

  return {
    success: true,
    message: ids.length === 1 ? 'Person deleted' : `${ids.length} people deleted`,
  };
}
