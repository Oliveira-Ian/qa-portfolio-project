import 'server-only';

import { cache } from 'react';
import type { AccountDto } from '@oliveira/schemas';
import { requestAccountList } from '@/lib/api/accounts';
import { requireSession } from '@/lib/session';

/** `null` covers both "not an admin" (the caller shouldn't have asked) and "no account yet". */
export const getAccountForPerson = cache(async (personId: string): Promise<AccountDto | null> => {
  const { token } = await requireSession();
  const result = await requestAccountList(token, { personId });

  if (!result.success) {
    return null;
  }

  return result.data[0] ?? null;
});
