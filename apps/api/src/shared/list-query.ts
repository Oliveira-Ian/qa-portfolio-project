import type { PaginationQuery } from '@oliveira/schemas';

/**
 * Server-side counterpart of `apps/web/components/data-table/types.ts`'s
 * `FilterType` — one entry per column a listing's `GET` route accepts a
 * quick filter for. `field` is a Prisma field path (dot-separated for one
 * level of relation, e.g. `"person.name"` on `AccessAccount`); `kind`
 * decides which query params are read and how they become a Prisma
 * condition. A column with no entry here is simply never filtered
 * server-side — used for the two computed, non-column values in this app
 * (`Profile.permissionCount`, `Account.profileCount`), which each
 * repository filters in memory instead (see the comment at their call
 * sites) rather than pretending a generic descriptor could express a
 * relation-count range.
 */
export type FilterKind = 'text' | 'boolean' | 'enumScalar' | 'enumArray' | 'date' | 'number';

export interface FilterFieldDescriptor {
  field: string;
  kind: FilterKind;
}

export type FilterFieldMap = Record<string, FilterFieldDescriptor>;

/** `page`/`pageSize` (1-based) → Prisma's `skip`/`take`. */
export function toSkipTake(pagination: PaginationQuery): { skip: number; take: number } {
  return { skip: (pagination.page - 1) * pagination.pageSize, take: pagination.pageSize };
}

/**
 * `sortBy` is only ever a value the caller already knows is safe to sort
 * on — the query column ids double as the whitelist. Anything not in
 * `sortFieldMap` (an unrecognized or omitted `sortBy`) falls back to the
 * routine's own default order, the same way an unknown filter column is
 * simply ignored rather than rejected.
 *
 * Always returns the primary order plus `tieBreaker` as a second entry —
 * `skip`/`take` pagination is only correct when every row the query touches
 * has a fully deterministic order. Sorting by, say, `active` alone ties
 * every row on the same side against each other; without a unique
 * secondary key (a routine's own id column), Postgres is free to order
 * those ties differently between two calls with different `skip` values,
 * which shows up as a row appearing on two pages, or on none.
 */
export function resolveSort(
  sortBy: string | undefined,
  sortOrder: 'asc' | 'desc',
  sortFieldMap: Record<string, string>,
  fallback: Record<string, unknown>,
  tieBreaker: Record<string, unknown>,
): Record<string, unknown>[] {
  const field = sortBy ? sortFieldMap[sortBy] : undefined;
  const primary = field ? (nest(field, sortOrder) as Record<string, unknown>) : fallback;
  return [primary, tieBreaker];
}

/** Builds the AND-combined Prisma `where` fragment for every active `f_*` query param this map knows about. */
export function buildFiltersWhere(
  query: Record<string, unknown>,
  fields: FilterFieldMap,
): Record<string, unknown> {
  let where: Record<string, unknown> = {};

  for (const [columnId, descriptor] of Object.entries(fields)) {
    const condition = buildCondition(query, columnId, descriptor);

    if (condition !== undefined) {
      where = deepMerge(where, nest(descriptor.field, condition) as Record<string, unknown>);
    }
  }

  return where;
}

function readParam(query: Record<string, unknown>, key: string): string | undefined {
  const value = query[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function buildCondition(
  query: Record<string, unknown>,
  columnId: string,
  descriptor: FilterFieldDescriptor,
): unknown {
  switch (descriptor.kind) {
    case 'text': {
      const value = readParam(query, `f_${columnId}`);
      return value === undefined ? undefined : { contains: value, mode: 'insensitive' };
    }

    case 'boolean': {
      const value = readParam(query, `f_${columnId}`);
      return value === undefined ? undefined : { equals: value === 'true' };
    }

    case 'enumScalar': {
      const values = readParam(query, `f_${columnId}`)?.split(',').filter(Boolean);
      return values && values.length > 0 ? { in: values } : undefined;
    }

    // A Prisma array-scalar field (`Person.types`) — matches a row whose
    // array contains at least one of the selected values, mirroring the
    // frontend's `enumFilterFn` "some match" semantics.
    case 'enumArray': {
      const values = readParam(query, `f_${columnId}`)?.split(',').filter(Boolean);
      return values && values.length > 0 ? { hasSome: values } : undefined;
    }

    case 'date': {
      const from = readParam(query, `f_${columnId}_from`);
      // Inclusive of the whole "to" day, matching the client-side
      // `dateRangeFilterFn` this replaces once a routine goes server-side.
      const to = readParam(query, `f_${columnId}_to`);

      if (from === undefined && to === undefined) {
        return undefined;
      }

      return {
        ...(from === undefined ? {} : { gte: new Date(from) }),
        ...(to === undefined ? {} : { lte: new Date(`${to}T23:59:59.999Z`) }),
      };
    }

    case 'number': {
      const min = readParam(query, `f_${columnId}_min`);
      const max = readParam(query, `f_${columnId}_max`);

      if (min === undefined && max === undefined) {
        return undefined;
      }

      return {
        ...(min === undefined ? {} : { gte: Number(min) }),
        ...(max === undefined ? {} : { lte: Number(max) }),
      };
    }
  }
}

/** `nest('person.name', 'asc')` → `{ person: { name: 'asc' } }`. */
function nest(path: string, value: unknown): unknown {
  return path
    .split('.')
    .reduceRight<unknown>((accumulator, segment) => ({ [segment]: accumulator }), value);
}

/** Merges nested filter objects without one column's condition clobbering another's sibling under the same relation key. */
function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  for (const [key, value] of Object.entries(source)) {
    const existing = target[key];

    if (isPlainObject(value) && isPlainObject(existing)) {
      target[key] = deepMerge(existing, value);
    } else {
      target[key] = value;
    }
  }

  return target;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)
  );
}
