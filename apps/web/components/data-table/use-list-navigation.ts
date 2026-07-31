'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  parseListQuery,
  serializeListQuery,
  type FilterableColumn,
  type ListQueryState,
} from '@/lib/list-query';

/**
 * The client half of "listing state lives in the URL" — `page.tsx` parses
 * the same `searchParams` server-side to fetch the right page from the API;
 * this re-derives the identical `ListQueryState` from `useSearchParams()`
 * so the two never see a different query, and turns a table-state change
 * into a `router.push` rather than local state. That `push` is what makes
 * `page.tsx` re-run with the new `searchParams` and fetch the next page —
 * there is no client-side fetch anywhere in this app (the session token
 * never leaves the server), so a URL navigation is the only way to ask for
 * different rows.
 */
export function useListNavigation(filterableColumns: FilterableColumn[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Keyed on the search string's own text, not `searchParams` itself or
  // `filterableColumns` — both would otherwise hand back a same-content but
  // differently-identitied `query.filters` array on every render (Next
  // returns a fresh `ReadonlyURLSearchParams` each time), which turns any
  // effect keyed on `query.filters` (`useDataTable`'s draft resync) into an
  // infinite render loop the moment a filter is active.
  const searchString = searchParams.toString();
  const query = useMemo(
    () => parseListQuery(searchParams, filterableColumns),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchString],
  );

  const setQuery = useCallback(
    (patch: Partial<ListQueryState>) => {
      const next: ListQueryState = { ...query, ...patch };
      const queryString = serializeListQuery(next);

      router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    },
    [query, router, pathname],
  );

  return { query, setQuery };
}
