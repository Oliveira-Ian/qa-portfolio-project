import { z } from 'zod';
import { accountRoleSchema, type AccountRole } from './auth.js';
import { paginationQuerySchema, sortQuerySchema } from './pagination.js';

/* -------------------------------------------------------------------------- */
/* Permissions (read-only from the API's point of view)                        */
/* -------------------------------------------------------------------------- */

export interface PermissionDto {
  id: number;
  resource: string;
  action: string;
  label: string | null;
}

/* -------------------------------------------------------------------------- */
/* Access profiles                                                             */
/* -------------------------------------------------------------------------- */

/**
 * `isSystem`/`isDefault` are deliberately absent from the writable shape —
 * they're seed-managed concepts (which profiles are protected from deletion,
 * which one self-registration links to), not something the admin UI sets
 * per-edit. The API still reports them on every `ProfileDto` it returns.
 */
export const profileWriteSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().nullable().optional(),
  permissionIds: z.array(z.number().int().positive()).default([]),
});

export type ProfileWriteInput = z.infer<typeof profileWriteSchema>;

export interface ProfileDto {
  id: number;
  name: string;
  description: string | null;
  isSystem: boolean;
  isDefault: boolean;
  permissions: PermissionDto[];
}

/** `GET /api/profiles`'s query contract — pagination, sort and a global `search` (name/description contains). */
export const profileListQuerySchema = paginationQuerySchema.extend(sortQuerySchema.shape).extend({
  search: z.string().trim().optional(),
});

export type ProfileListQuery = z.infer<typeof profileListQuerySchema>;

/* -------------------------------------------------------------------------- */
/* Accounts                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Admin-initiated account creation, for an existing Person — distinct from
 * self-registration (`registerSchema` in auth.ts), which creates the Person
 * too. The person must not already have an account.
 */
export const accountCreateSchema = z.object({
  personId: z.string().trim().min(1, 'Person is required'),
  email: z.string().trim().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export type AccountCreateInput = z.infer<typeof accountCreateSchema>;

export const accountUpdateSchema = z
  .object({
    active: z.boolean().optional(),
    role: accountRoleSchema.optional(),
  })
  .refine((data) => data.active !== undefined || data.role !== undefined, {
    message: 'Provide at least one field to update',
  });

export type AccountUpdateInput = z.infer<typeof accountUpdateSchema>;

export const accountProfileLinkSchema = z.object({
  profileId: z.number().int().positive(),
});

export type AccountProfileLinkInput = z.infer<typeof accountProfileLinkSchema>;

export interface AccountDto {
  id: number;
  personId: string;
  personName: string;
  email: string;
  role: AccountRole;
  active: boolean;
  createdAt: string;
  profiles: { id: number; name: string }[];
}

/**
 * `GET /api/accounts`'s query contract — pagination, sort, a global `search`
 * (person name/email contains), plus the existing `personId` scoping filter
 * (Person's edit page uses this alone, without pagination, to check whether
 * a person already has an account).
 */
export const accountListQuerySchema = paginationQuerySchema.extend(sortQuerySchema.shape).extend({
  search: z.string().trim().optional(),
  personId: z.string().trim().optional(),
});

export type AccountListQuery = z.infer<typeof accountListQuerySchema>;
