import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/require-auth.js';
import { requireRole } from '../auth/authorize.js';
import { permissionController } from './permission.controller.js';

/** The catalog itself — system administration, gated by role like the rest of it. */
export async function permissionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', requireRole('ADMIN'));

  app.get(
    '/',
    {
      schema: { tags: ['permissions'], security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to list permissions' },
    },
    permissionController.list,
  );
}
