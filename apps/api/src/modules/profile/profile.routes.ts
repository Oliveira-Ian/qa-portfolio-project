import type { FastifyInstance } from 'fastify';
import { profileListQuerySchema, profileWriteSchema } from '@oliveira/schemas';
import { docsOnlyValidatorCompiler } from '../../plugins/openapi.js';
import type { WithId } from '../../shared/params.js';
import { requireAuth } from '../auth/require-auth.js';
import { requirePermission, requireProductAccess } from '../auth/authorize.js';
import { profileController } from './profile.controller.js';

/**
 * The ERP's profiles — gated by a seat in the ERP and the `profile:manage`
 * permission, not by any role (docs/adr/0018). Unlike
 * `/api/persons`, POST/PUT return the full resource: this is greenfield API
 * surface with no legacy "message only" contract to preserve, and the admin
 * UI needs the created/updated profile's id and permission list right away.
 */
export async function profileRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', requireProductAccess('ERP'));
  app.addHook('preHandler', requirePermission('profile:manage'));

  app.get(
    '/',
    {
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: {
        tags: ['profiles'],
        querystring: profileListQuerySchema,
        security: [{ bearerAuth: [] }],
      },
      config: { errorMessage: 'Failed to list profiles' },
    },
    profileController.list,
  );
  app.get<WithId>(
    '/:id',
    {
      schema: { tags: ['profiles'], security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to get profile' },
    },
    profileController.getById,
  );
  app.post(
    '/',
    {
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: { tags: ['profiles'], body: profileWriteSchema, security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to create profile' },
    },
    profileController.create,
  );
  app.put<WithId>(
    '/:id',
    {
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: { tags: ['profiles'], body: profileWriteSchema, security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to update profile' },
    },
    profileController.update,
  );
  app.delete<WithId>(
    '/:id',
    {
      schema: { tags: ['profiles'], security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to delete profile' },
    },
    profileController.remove,
  );
}
