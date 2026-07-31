import type { FastifyRequest } from 'fastify';
import type { AccountRole, PermissionKey } from '@oliveira/schemas';
import { ForbiddenError, UnauthorizedError } from '../../shared/errors.js';
import { getEffectivePermissions } from './permissions.service.js';

declare module 'fastify' {
  interface FastifyRequest {
    /** Memoized per request by `requirePermission` — see `resolvePermissions`. */
    permissions?: Set<PermissionKey>;
  }
}

/**
 * Route `preHandler` factory gating a route by *technical* role — system
 * administration (accounts, profiles, the permission catalog), not business
 * permissions. Must run after `requireAuth` (relies on `request.account`).
 */
export function requireRole(...allowed: AccountRole[]) {
  return async function requireRoleHook(request: FastifyRequest): Promise<void> {
    if (!request.account) {
      throw new UnauthorizedError();
    }

    if (!allowed.includes(request.account.role)) {
      throw new ForbiddenError();
    }
  };
}

async function resolvePermissions(request: FastifyRequest): Promise<Set<PermissionKey>> {
  if (!request.permissions) {
    // request.account is guaranteed by this point — requirePermission checks
    // it before ever calling this function.
    request.permissions = await getEffectivePermissions(request.account!.id);
  }

  return request.permissions;
}

/**
 * Route `preHandler` factory gating a route by *business* permission (the
 * catalog in packages/schemas/src/permissions.ts). Must run after
 * `requireAuth`.
 *
 * ADMIN accounts bypass this entirely — they're the system's root accounts,
 * not a profile assignment (see docs/product/access_control.md). Every other
 * account needs the permission granted by at least one of its AccessProfiles.
 */
export function requirePermission(key: PermissionKey) {
  return async function requirePermissionHook(request: FastifyRequest): Promise<void> {
    if (!request.account) {
      throw new UnauthorizedError();
    }

    if (request.account.role === 'ADMIN') {
      return;
    }

    const permissions = await resolvePermissions(request);

    if (!permissions.has(key)) {
      throw new ForbiddenError();
    }
  };
}
