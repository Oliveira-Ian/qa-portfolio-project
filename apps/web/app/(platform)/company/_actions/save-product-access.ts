'use server';

import { z } from 'zod';
import { productSchema } from '@oliveira/schemas';
import type { ActionResult } from '@/lib/actions';
import { applySeatChanges } from '@/lib/api/company';
import { requireSession } from '@/lib/session';
import { revalidateCompany } from './revalidate-company';

const saveProductAccessSchema = z.object({
  changes: z
    .array(
      z.object({
        membershipId: z.string().min(1),
        product: productSchema,
        granted: z.boolean(),
      }),
    )
    .min(1),
});

export type SaveProductAccessInput = z.input<typeof saveProductAccessSchema>;

/**
 * The Product access screen's "Save changes": every switch that moved, in one
 * go. Access is never saved on toggle — an explicit Save (handoff § 4) — so the
 * whole set arrives together and is applied revocations-first
 * (`applySeatChanges`): taking a seat from one member and giving it to another in
 * the same save works at the limit. The first refusal stops it; what was applied
 * stays, and the screen refreshes either way.
 */
export async function saveProductAccessAction(
  values: SaveProductAccessInput,
): Promise<ActionResult> {
  const parsed = saveProductAccessSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid data' };
  }

  const { token } = await requireSession();

  try {
    const applied = await applySeatChanges(token, parsed.data.changes);

    return applied.success ? { success: true } : { success: false, message: applied.error };
  } finally {
    revalidateCompany();
  }
}
