import 'server-only';

import { cache } from 'react';
import type { AccountDto, PaginatedResult } from '@oliveira/schemas';
import { unwrap } from '@/lib/api/client';
import { requestAccountList } from '@/lib/api/accounts';
import type { ListQueryState } from '@/lib/list-query';
import { requireSession } from '@/lib/session';

export const listAccounts = cache(
  async (query: ListQueryState): Promise<PaginatedResult<AccountDto>> => {
    const { token } = await requireSession();

    return unwrap(await requestAccountList(token, query));
  },
);
