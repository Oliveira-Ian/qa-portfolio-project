/** The largest value Postgres' `integer` (the numeric ids' column type) holds. */
const MAX_INT4 = 2_147_483_647;

/**
 * Route params are always strings — Fastify never parses them — even when the
 * underlying id is numeric (`AccessProfile`, `AccessAccount`) rather than a
 * uuid (`Person`). `parseId()` is the one place the conversion happens, so
 * every numeric-id controller calls the same conversion instead of repeating it.
 *
 * Anything that cannot be an id — `abc`, `12abc`, `-3`, a number past `integer` —
 * becomes `-1`, which no row has. Handing Prisma a `NaN` or an out-of-range value
 * made it throw a validation error, and `GET /api/profiles/abc` answered 500; with
 * `-1` the lookup simply finds nothing and the caller's own "… not found" 404 runs.
 */
export function parseId(raw: string): number {
  const id = /^\d+$/.test(raw) ? Number(raw) : Number.NaN;

  return Number.isSafeInteger(id) && id <= MAX_INT4 ? id : -1;
}

/** The single most common route shape: one `:id` param. */
export interface WithId {
  Params: { id: string };
}

/** For routes with more than one param, e.g. `/:id/profiles/:profileId`. */
export interface WithParams<TKey extends string> {
  Params: Record<TKey, string>;
}
