import type { FastifyInstance } from 'fastify';
import type { ProductRouteOptions } from '../../shared/product-route.js';
import { requireAuth } from '../auth/require-auth.js';
import { requirePermission, requireProductAccess } from '../auth/authorize.js';
import { createPermissionController } from './permission.controller.js';

/**
 * A product's permission catalog, read-only — what its profile editor offers.
 * Registered once per product (`/api/permissions` is the ERP's,
 * `/api/fsm/permissions` the FSM's), each behind that product's seat and its own
 * `profile:manage`.
 */
export async function permissionRoutes(app: FastifyInstance, { product }: ProductRouteOptions) {
  const controller = createPermissionController(product);

  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', requireProductAccess(product));
  app.addHook('preHandler', requirePermission(product, 'profile:manage'));

  app.get(
    '/',
    {
      schema: { tags: ['permissions'], security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to list permissions' },
    },
    controller.list,
  );
}
