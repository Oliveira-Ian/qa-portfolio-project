import 'server-only';

import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { AccountDto } from '@oliveira/schemas';
import { requestAccount } from '@/lib/api/accounts';
import { ApiError } from '@/lib/api/client';
import { requireSession } from '@/lib/session';

/** One member as the ERP sees them. A 404 (not a member of this company) is Next's not-found page. */
export const getAccount = cache(async (id: number): Promise<AccountDto> => {
  const { token } = await requireSession();
  const result = await requestAccount(token, id, 'ERP');

  if (!result.success) {
    if (result.status === 404) {
      notFound();
    }

    throw new ApiError(result.error, result.status);
  }

  return result.data;
});
