import type { ColumnFiltersState } from '@tanstack/react-table';
import type { FilterType } from '@/components/data-table/types';

/**
 * Isomorphic on purpose — no `'server-only'`, no `'use client'`. `page.tsx`
 * (a Server Component) parses `searchParams` with this to call the API with
 * the right page/sort/filter, and the routine's own list Client Component
 * uses the same functions to turn a table-state change into the next URL
 * (`router.push`), so the two directions of the same translation never
 * drift into two different encodings of the same query string.
 */
export interface ListQueryState {
  page: number;
  pageSize: number;
  sortBy: string | undefined;
  sortOrder: 'asc' | 'desc';
  search: string;
  filters: ColumnFiltersState;
}

export const DEFAULT_PAGE_SIZE = 10;

/** For a one-off lookup (e.g. "does this person already have an account?") that isn't a real listing screen and has no URL of its own. */
export const EMPTY_LIST_QUERY: ListQueryState = {
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  sortBy: undefined,
  sortOrder: 'asc',
  search: '',
  filters: [],
};

export interface FilterableColumn {
  id: string;
  filterType: FilterType;
}

/** Next's `searchParams` prop is a plain record, not a `URLSearchParams` — this is the one conversion between the two shapes `parseListQuery` needs. */
export function toURLSearchParams(
  record: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(record)) {
    if (value === undefined) {
      continue;
    }

    for (const entry of Array.isArray(value) ? value : [value]) {
      params.append(key, entry);
    }
  }

  return params;
}

/**
 * `searchParams` accepts a `URLSearchParams` or Next's own
 * `ReadonlyURLSearchParams` (from `useSearchParams()`) — both implement the
 * same `.get()` read API this only relies on.
 */
export function parseListQuery(
  searchParams: Pick<URLSearchParams, 'get'>,
  filterableColumns: FilterableColumn[],
): ListQueryState {
  const filters: ColumnFiltersState = [];

  for (const column of filterableColumns) {
    const value = parseFilterValue(searchParams, column.id, column.filterType);

    if (value !== undefined) {
      filters.push({ id: column.id, value });
    }
  }

  return {
    page: toPositiveInt(searchParams.get('page')) ?? 1,
    pageSize: toPositiveInt(searchParams.get('pageSize')) ?? DEFAULT_PAGE_SIZE,
    sortBy: searchParams.get('sortBy') ?? undefined,
    sortOrder: searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc',
    search: searchParams.get('search') ?? '',
    filters,
  };
}

/** The reverse of `parseListQuery` — the querystring a table-state change should navigate to. */
export function serializeListQuery(query: ListQueryState): string {
  const params = new URLSearchParams();

  if (query.page > 1) {
    params.set('page', String(query.page));
  }

  if (query.pageSize !== DEFAULT_PAGE_SIZE) {
    params.set('pageSize', String(query.pageSize));
  }

  if (query.sortBy) {
    params.set('sortBy', query.sortBy);
    params.set('sortOrder', query.sortOrder);
  }

  if (query.search) {
    params.set('search', query.search);
  }

  for (const filter of query.filters) {
    serializeFilterValue(params, filter.id, filter.value);
  }

  return params.toString();
}

function toPositiveInt(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parseFilterValue(
  searchParams: Pick<URLSearchParams, 'get'>,
  id: string,
  filterType: FilterType,
): unknown {
  if (filterType === 'date') {
    const from = searchParams.get(`f_${id}_from`) ?? undefined;
    const to = searchParams.get(`f_${id}_to`) ?? undefined;
    return from || to ? { from, to } : undefined;
  }

  if (filterType === 'number') {
    const min = searchParams.get(`f_${id}_min`);
    const max = searchParams.get(`f_${id}_max`);

    if (min === null && max === null) {
      return undefined;
    }

    return {
      min: min === null ? undefined : Number(min),
      max: max === null ? undefined : Number(max),
    };
  }

  if (filterType === 'enum') {
    const values = searchParams.get(`f_${id}`)?.split(',').filter(Boolean);
    return values && values.length > 0 ? values : undefined;
  }

  // 'text' | 'boolean' — both a single raw string (a search term, or 'true'/'false').
  const raw = searchParams.get(`f_${id}`);
  return raw === null || raw === '' ? undefined : raw;
}

function serializeFilterValue(params: URLSearchParams, id: string, value: unknown): void {
  if (value === undefined || value === null) {
    return;
  }

  if (Array.isArray(value)) {
    if (value.length > 0) {
      params.set(`f_${id}`, value.join(','));
    }

    return;
  }

  if (typeof value === 'object') {
    const range = value as { from?: string; to?: string; min?: number; max?: number };

    if (range.from) {
      params.set(`f_${id}_from`, range.from);
    }

    if (range.to) {
      params.set(`f_${id}_to`, range.to);
    }

    if (range.min !== undefined) {
      params.set(`f_${id}_min`, String(range.min));
    }

    if (range.max !== undefined) {
      params.set(`f_${id}_max`, String(range.max));
    }

    return;
  }

  params.set(`f_${id}`, String(value));
}
