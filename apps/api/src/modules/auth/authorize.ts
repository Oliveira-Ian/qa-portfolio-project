import type { FastifyRequest } from 'fastify';
import {
  PRODUCT_LABELS,
  type AccountRole,
  type PermissionKey,
  type Product,
} from '@oliveira/schemas';
import { ForbiddenError, UnauthorizedError } from '../../shared/errors.js';
import { getEffectivePermissions } from './permissions.service.js';

declare module 'fastify' {
  interface FastifyRequest {
    /** Memoized per request by `requirePermission` — see `resolvePermissions`. */
    permissions?: Set<PermissionKey>;
  }
}

/**
 * A route guard: throws (`UnauthorizedError`/`ForbiddenError`) to refuse, and
 * returns to let the request through.
 */
export type RouteGuard = (request: FastifyRequest) => Promise<void>;

/**
 * Route `preHandler` factory gating a route by the account's role on the
 * **Platform** — layer 1 of docs/adr/0018. Only for what administers the
 * Platform itself (an account's global role and active flag); it says nothing
 * about a company or a product. Must run after `requireAuth`.
 */
export function requireRole(...allowed: AccountRole[]): RouteGuard {
  return async function requireRoleHook(request: FastifyRequest): Promise<void> {
    if (!request.account) {
      throw new UnauthorizedError();
    }

    if (!allowed.includes(request.account.role)) {
      throw new ForbiddenError();
    }
  };
}

/**
 * Layer 3: the caller may enter this product — their company contracted it and
 * granted them a seat (`companyService.resolveAccess`). This is the boundary
 * for every route of a product; the web's area layout repeats it for the
 * user's benefit, but a Server Action is a public endpoint, so only this holds.
 * Runs before the route's own `requirePermission`. Must run after `requireAuth`.
 */
export function requireProductAccess(product: Product): RouteGuard {
  return async function requireProductAccessHook(request: FastifyRequest): Promise<void> {
    if (!request.account) {
      throw new UnauthorizedError();
    }

    if (!request.access?.products.has(product)) {
      throw new ForbiddenError(`No access to ${PRODUCT_LABELS[product]}`);
    }
  };
}

/**
 * Layer 2: the caller administers their own company (`Membership.role`), and
 * the company is active. It grants nothing in any product (docs/adr/0018).
 * Must run after `requireAuth`.
 */
export const requireCompanyAdmin: RouteGuard = async function requireCompanyAdmin(request) {
  if (!request.account) {
    throw new UnauthorizedError();
  }

  if (request.access?.membership?.role !== 'ADMIN' || !request.access.isCompanyActive) {
    throw new ForbiddenError();
  }
};

/** Lets the request through if **any** guard does — a refusal is a `ForbiddenError`; anything else propagates. */
export function requireAnyOf(...guards: RouteGuard[]): RouteGuard {
  return async function requireAnyOfHook(request: FastifyRequest): Promise<void> {
    let refusal: ForbiddenError | undefined;

    for (const guard of guards) {
      try {
        await guard(request);
        return;
      } catch (error) {
        if (!(error instanceof ForbiddenError)) {
          throw error;
        }

        refusal ??= error;
      }
    }

    throw refusal ?? new ForbiddenError();
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
 * Layer 4: the caller's profiles grant this permission — the catalog in
 * packages/schemas/src/permissions.ts, which today is the ERP's. Must run
 * after `requireAuth` and, on a product's routes, after `requireProductAccess`.
 *
 * No role is exempt: neither `SUPER_ADMIN` nor a company `ADMIN` gets a
 * permission from being an administrator (docs/adr/0018, which removes the
 * bypass of 0004). Whoever needs one gets it from a profile like anyone else.
 */
export function requirePermission(key: PermissionKey): RouteGuard {
  return async function requirePermissionHook(request: FastifyRequest): Promise<void> {
    if (!request.account) {
      throw new UnauthorizedError();
    }

    const permissions = await resolvePermissions(request);

    if (!permissions.has(key)) {
      throw new ForbiddenError();
    }
  };
}
