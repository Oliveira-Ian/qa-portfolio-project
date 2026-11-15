import 'server-only';

import { cache } from 'react';
import type { CompanyMembersDto } from '@oliveira/schemas';
import { requestCompanyMembers } from '@/lib/api/company';
import { unwrap } from '@/lib/api/client';
import { requireSession } from '@/lib/session';

/**
 * The caller's company — its contracts with the seats in use, and every member.
 * Company admins only: for anyone else the API answers `403`, which is why the
 * pages check `isCompanyAdmin()` before calling this. `cache()` dedupes it within
 * one render, so a layout, a page and a strip can all ask for it.
 */
export const getCompanyMembers = cache(async (): Promise<CompanyMembersDto> => {
  const { token } = await requireSession();

  return unwrap(await requestCompanyMembers(token));
});
