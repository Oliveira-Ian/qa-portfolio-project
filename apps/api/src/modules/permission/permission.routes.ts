import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/require-auth.js';
import { requirePermission, requireProductAccess } from '../auth/authorize.js';
import { permissionController } from './permission.controller.js';

/** The catalog itself — read by whoever manages the ERP's profiles, like the rest of it. */
export async function permissionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', requireProductAccess('ERP'));
  app.addHook('preHandler', requirePermission('profile:manage'));

  app.get(
    '/',
    {
      schema: { tags: ['permissions'], security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to list permissions' },
    },
    permissionController.list,
  );
}
