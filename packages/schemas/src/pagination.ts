import { z } from 'zod';

/**
 * Shared by every listing endpoint (`/api/persons`, `/api/profiles`,
 * `/api/accounts`) so a routine never invents its own page/pageSize
 * contract. `pageSize` is capped at 100 — the point of server-side
 * pagination is not letting a client ask for the whole table in one page.
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/**
 * `sortBy` is validated as "a non-empty string" here only — each repository
 * maps it against its own whitelist of sortable columns (`SORT_FIELD_MAP`)
 * and falls back to that routine's default sort for anything unrecognized,
 * the same way an unknown `filterType` column is simply ignored rather than
 * rejected. That keeps this schema generic across entities with entirely
 * different sortable columns.
 */
export const sortQuerySchema = z.object({
  sortBy: z.string().trim().min(1).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type SortQuery = z.infer<typeof sortQuerySchema>;

/** The envelope every paginated listing endpoint returns as `data`. */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
