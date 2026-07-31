import 'server-only';

import { cache } from 'react';
import type { AccountDto } from '@oliveira/schemas';
import { unwrap } from '@/lib/api/client';
import { requestAccountList } from '@/lib/api/accounts';
import { requireSession } from '@/lib/session';

export const listAccounts = cache(async (): Promise<AccountDto[]> => {
  const { token } = await requireSession();
  return unwrap(await requestAccountList(token));
});
