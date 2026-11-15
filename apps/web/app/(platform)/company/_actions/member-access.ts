'use server';

import {
  accountUpdateSchema,
  productSchema,
  type AccountUpdateInput,
  type Product,
} from '@oliveira/schemas';
import type { ActionResult } from '@/lib/actions';
import { requestAccountSetProfile, requestAccountUpdate } from '@/lib/api/accounts';
import { requireSession } from '@/lib/session';
import { revalidateCompany } from './revalidate-company';

/**
 * The member's profile in one product, set from the Platform's member page. It
 * goes through the product's own API (`/api/accounts`, `/api/fsm/accounts`),
 * which allows it only to someone who manages that product's profiles — the
 * Platform grants nothing by itself.
 */
export async function setMemberProfileAction(
  accountId: number,
  product: Product,
  profileId: string,
): Promise<ActionResult> {
  if (!productSchema.safeParse(product).success) {
    return { success: false, message: 'Unknown product' };
  }

  const { token } = await requireSession();
  const result = await requestAccountSetProfile(
    token,
    accountId,
    profileId === '' ? null : Number(profileId),
    product,
  );

  if (!result.success) {
    return { success: false, message: result.error };
  }

  revalidateCompany();

  return { success: true };
}

/** The account's Platform role and active flag — the API allows it to a `SUPER_ADMIN` only. */
export async function updateMemberAccountAction(
  accountId: number,
  patch: AccountUpdateInput,
): Promise<ActionResult> {
  const parsed = accountUpdateSchema.safeParse(patch);

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid data' };
  }

  const { token } = await requireSession();
  const result = await requestAccountUpdate(token, accountId, parsed.data);

  if (!result.success) {
    return { success: false, message: result.error };
  }

  revalidateCompany();

  return { success: true };
}
