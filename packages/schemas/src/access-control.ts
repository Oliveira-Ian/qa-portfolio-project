import { z } from 'zod';
import { accountRoleSchema, type AccountRole } from './auth.js';
import { paginationQuerySchema, sortQuerySchema } from './pagination.js';
import type { Product } from './platform.js';

/* -------------------------------------------------------------------------- */
/* Permissions (read-only from the API's point of view)                        */
/* -------------------------------------------------------------------------- */

export interface PermissionDto {
  id: number;
  product: Product;
  resource: string;
  action: string;
  label: string | null;
}

/* -------------------------------------------------------------------------- */
/* Access profiles                                                             */
/* -------------------------------------------------------------------------- */

/**
 * `isSystem`/`isDefault` are deliberately absent from the writable shape —
 * they're provisioning concepts (which profiles are protected from deletion,
 * which one a first seat links), not something the admin UI sets per edit. The
 * product is absent too: it is the route's (`/api/profiles` is the ERP's,
 * `/api/fsm/profiles` the FSM's), never the client's to choose.
 */
export const profileWriteSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().nullable().optional(),
  permissionIds: z.array(z.number().int().positive()).default([]),
});

export type ProfileWriteInput = z.infer<typeof profileWriteSchema>;

export interface ProfileDto {
  id: number;
  product: Product;
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
 * Admin-initiated account creation, for a Person of the caller's company —
 * distinct from self-registration (`registerSchema` in auth.ts). The new login
 * takes the person's name and joins the company as a member linked to that
 * person (docs/adr/0013); the person must not already be linked to a member.
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
  /** The person this member is linked to in the caller's company, if any. */
  personId: string | null;
  /**
   * The account's display name. Still called `personName` because it is a
   * column key the Users grid's saved preferences and filters already use.
   */
  personName: string;
  email: string;
  role: AccountRole;
  active: boolean;
  createdAt: string;
  profiles: { id: number; name: string }[];
}

/**
 * `GET /api/accounts`'s query contract — pagination, sort, a global `search`
 * (name/email contains), plus the existing `personId` scoping filter
 * (Person's edit page uses this alone, without pagination, to check whether
 * a person is already linked to a member's login).
 */
export const accountListQuerySchema = paginationQuerySchema.extend(sortQuerySchema.shape).extend({
  search: z.string().trim().optional(),
  personId: z.string().trim().optional(),
});

export type AccountListQuery = z.infer<typeof accountListQuerySchema>;
