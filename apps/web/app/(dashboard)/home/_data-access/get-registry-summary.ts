import 'server-only';

import { cache } from 'react';
import type { PersonSummaryDto } from '@oliveira/schemas';
import { unwrap } from '@/lib/api/client';
import { requestPersonSummary } from '@/lib/api/persons';
import { requireSession } from '@/lib/session';

export type RegistrySummary = PersonSummaryDto;

/**
 * One request — `GET /api/persons/summary` does the four `COUNT`s and the
 * `LIMIT 5` in Postgres. This used to fetch every person over HTTP and fold
 * them here instead; that stopped being an option once the People grid
 * moved to server-side pagination (there's no "just fetch everything" call
 * left to reuse). `cache()` means the layout and the page share one call.
 */
export const getRegistrySummary = cache(async (): Promise<RegistrySummary> => {
  const { token } = await requireSession();

  return unwrap(await requestPersonSummary(token));
});
