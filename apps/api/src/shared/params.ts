/**
 * Route params are always strings — Fastify never parses them — even when the
 * underlying id is numeric (`AccessProfile`, `AccessAccount`) rather than a
 * uuid (`Person`). `parseId()` is the one place `Number.parseInt` happens, so
 * every numeric-id controller calls the same conversion instead of repeating it.
 */
export function parseId(raw: string): number {
  return Number.parseInt(raw, 10);
}

/** The single most common route shape: one `:id` param. */
export interface WithId {
  Params: { id: string };
}

/** For routes with more than one param, e.g. `/:id/profiles/:profileId`. */
export interface WithParams<TKey extends string> {
  Params: Record<TKey, string>;
}
