import 'server-only';

import { cache } from 'react';
import type { Person, PersonQuery } from '@oliveira/schemas';
import { unwrap } from '@/lib/api/client';
import { requestPersonList } from '@/lib/api/persons';
import { requireSession } from '@/lib/session';

/**
 * Reads the registry on the server, with the session token attached.
 *
 * A failure throws so the nearest `error.tsx` renders — a list page that
 * silently shows "no records" when the API is down is worse than an error.
 */
export const listPersons = cache(async (query: PersonQuery = {}): Promise<Person[]> => {
  const { token } = await requireSession();

  return unwrap(await requestPersonList(token, query));
});
