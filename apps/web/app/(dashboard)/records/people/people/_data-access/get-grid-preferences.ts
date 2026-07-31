import 'server-only';

import { cache } from 'react';
import type { GridColumnPreferenceDto } from '@oliveira/schemas';
import { unwrap } from '@/lib/api/client';
import { requestGridPreference } from '@/lib/api/grid-preferences';
import { requireSession } from '@/lib/session';

/** Identifies this grid to the shared preferences backend — see `docs/api/http_responses.md`. */
export const PERSON_GRID_KEY = 'person-list';

export const getPersonGridPreference = cache(async (): Promise<GridColumnPreferenceDto | null> => {
  const { token } = await requireSession();
  return unwrap(await requestGridPreference(token, PERSON_GRID_KEY));
});
