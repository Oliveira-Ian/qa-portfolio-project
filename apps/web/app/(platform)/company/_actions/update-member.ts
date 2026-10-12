'use server';

import { z } from 'zod';
import {
  membershipRoleSchema,
  membershipStatusSchema,
  memberUpdateSchema,
  productSchema,
} from '@oliveira/schemas';
import type { ActionResult } from '@/lib/actions';
import { applySeatChanges, requestUpdateMember } from '@/lib/api/company';
import { requireSession } from '@/lib/session';
import { revalidateCompany } from './revalidate-company';

const saveMemberSchema = z.object({
  membershipId: z.string().min(1),
  role: membershipRoleSchema.optional(),
  seats: z.array(z.object({ product: productSchema, granted: z.boolean() })).default([]),
});

export type SaveMemberInput = z.input<typeof saveMemberSchema>;

/**
 * The drawer's "Save changes": the member's company role, if it changed, and
 * their product seats, if they did. The role goes first; the seats follow in an
 * order that can't trip the licence limit needlessly (revocations before grants,
 * `applySeatChanges`). It stops at the first refusal — a last-admin guard, a
 * licence limit — and what was applied before stays applied; the screen refreshes
 * either way, so it shows the truth.
 */
export async function saveMemberAction(values: SaveMemberInput): Promise<ActionResult> {
  const parsed = saveMemberSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid data' };
  }

  const { membershipId, role, seats } = parsed.data;
  const { token } = await requireSession();

  try {
    if (role) {
      const update = memberUpdateSchema.safeParse({ role });

      if (!update.success) {
        return { success: false, message: update.error.issues[0]?.message ?? 'Invalid data' };
      }

      const result = await requestUpdateMember(token, membershipId, update.data);

      if (!result.success) {
        return { success: false, message: result.error };
      }
    }

    const applied = await applySeatChanges(
      token,
      seats.map((seat) => ({ membershipId, ...seat })),
    );

    if (!applied.success) {
      return { success: false, message: applied.error };
    }

    return { success: true };
  } finally {
    revalidateCompany();
  }
}

/** Deactivate or reactivate a membership — an inactive member opens no product and uses no seat. */
export async function setMemberStatusAction(
  membershipId: string,
  status: z.infer<typeof membershipStatusSchema>,
): Promise<ActionResult> {
  const update = memberUpdateSchema.safeParse({ status });

  if (!update.success || membershipId.length === 0) {
    return { success: false, message: update.error?.issues[0]?.message ?? 'Invalid data' };
  }

  const { token } = await requireSession();
  const result = await requestUpdateMember(token, membershipId, update.data);

  if (!result.success) {
    return { success: false, message: result.error };
  }

  revalidateCompany();

  return { success: true };
}
