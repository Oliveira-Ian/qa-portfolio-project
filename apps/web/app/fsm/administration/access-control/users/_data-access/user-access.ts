import 'server-only';

import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { AccountDto, PaginatedResult } from '@oliveira/schemas';
import { requestAccount, requestAccountList } from '@/lib/api/accounts';
import { ApiError, unwrap } from '@/lib/api/client';
import { createGridPreferenceAccess } from '@/lib/grid-preferences';
import type { ListQueryState } from '@/lib/list-query';
import { requireSession } from '@/lib/session';

/** The company's members as the FSM sees them, each with their one FSM profile. */
export const listFsmAccounts = cache(
  async (query: ListQueryState): Promise<PaginatedResult<AccountDto>> => {
    const { token } = await requireSession();

    return unwrap(await requestAccountList(token, query, undefined, 'FSM'));
  },
);

/** One member as the FSM sees them. A 404 is Next's not-found page. */
export const getFsmAccount = cache(async (id: number): Promise<AccountDto> => {
  const { token } = await requireSession();
  const result = await requestAccount(token, id, 'FSM');

  if (!result.success) {
    if (result.status === 404) {
      notFound();
    }

    throw new ApiError(result.error, result.status);
  }

  return result.data;
});

export const fsmAccountGrid = createGridPreferenceAccess('fsm-account-list');
