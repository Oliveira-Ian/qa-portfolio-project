'use server';

import { memberAddSchema, type MemberAddInput } from '@oliveira/schemas';
import type { ActionResult } from '@/lib/actions';
import { requestAddMember } from '@/lib/api/company';
import { requireSession } from '@/lib/session';
import { revalidateCompany } from './revalidate-company';

/**
 * Adds an existing, company-less account to the caller's company, by e-mail.
 * The API answers the same generic sentence whether or not that address had an
 * account — so the screen can say "done" without revealing who is registered —
 * and this action passes it through untouched.
 */
export async function addMemberAction(values: MemberAddInput): Promise<ActionResult> {
  const parsed = memberAddSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid data' };
  }

  const { token } = await requireSession();
  const result = await requestAddMember(token, parsed.data);

  if (!result.success) {
    return { success: false, message: result.error };
  }

  revalidateCompany();

  return { success: true, message: result.data.message };
}
