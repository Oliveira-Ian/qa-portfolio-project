import 'server-only';

import { cache } from 'react';
import type { CompanyProfileDto } from '@oliveira/schemas';
import { unwrap } from '@/lib/api/client';
import { requestCompanyProfile } from '@/lib/api/company';
import { requireSession } from '@/lib/session';

/** The caller's company's registration — central Platform data. */
export const getCompanyProfile = cache(async (): Promise<CompanyProfileDto> => {
  const { token } = await requireSession();

  return unwrap(await requestCompanyProfile(token));
});
