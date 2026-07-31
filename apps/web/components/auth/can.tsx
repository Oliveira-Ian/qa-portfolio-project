import type { PermissionKey } from '@oliveira/schemas';
import { can } from '@/lib/permissions';

interface CanProps {
  permission: PermissionKey;
  children: React.ReactNode;
  /** Rendered instead when the permission is missing. Defaults to nothing. */
  fallback?: React.ReactNode;
}

/**
 * Gates UI by business permission, server-side — an async Server Component,
 * not a client-side check, so a user without the permission never receives
 * the markup at all (not just a hidden button still sitting in the DOM).
 *
 * For a role-based gate (e.g. "ADMIN only"), check `me.account.role` from
 * `lib/permissions.ts#getMe()` directly instead — `<Can>` only understands
 * the business-permission catalog, not the technical role.
 */
export async function Can({ permission, children, fallback = null }: CanProps) {
  return (await can(permission)) ? children : fallback;
}
