import 'server-only';

import { cache } from 'react';
import type { PaginatedResult, Person } from '@oliveira/schemas';
import { unwrap } from '@/lib/api/client';
import { requestPersonList } from '@/lib/api/persons';
import type { ListQueryState } from '@/lib/list-query';
import { requireSession } from '@/lib/session';

/**
 * Reads one page of the registry on the server, with the session token
 * attached — `query` (page/pageSize/sort/search/filters) comes straight
 * from `page.tsx`'s parsed `searchParams`, so a change to any of it is a
 * real navigation, not client-side state.
 *
 * A failure throws so the nearest `error.tsx` renders — a list page that
 * silently shows "no records" when the API is down is worse than an error.
 */
export const listPersons = cache(
  async (query: ListQueryState): Promise<PaginatedResult<Person>> => {
    const { token } = await requireSession();

    return unwrap(await requestPersonList(token, query));
  },
);
