import type { FastifyInstance } from 'fastify';
import { profileListQuerySchema, profileWriteSchema } from '@oliveira/schemas';
import { docsOnlyValidatorCompiler } from '../../plugins/openapi.js';
import type { WithId } from '../../shared/params.js';
import type { ProductRouteOptions } from '../../shared/product-route.js';
import { requireAuth } from '../auth/require-auth.js';
import { requirePermission, requireProductAccess } from '../auth/authorize.js';
import { createProfileController } from './profile.controller.js';

/**
 * One product's profiles in the caller's company — registered once per product
 * (`/api/profiles` is the ERP's, `/api/fsm/profiles` the FSM's), each gated by a
 * seat in that product and that product's `profile:manage`, never by a role
 * (docs/adr/0018). Unlike `/api/persons`, POST/PUT return the full resource:
 * the admin UI needs the created/updated profile's id and permissions right away.
 */
export async function profileRoutes(app: FastifyInstance, { product }: ProductRouteOptions) {
  const profileController = createProfileController(product);

  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', requireProductAccess(product));
  app.addHook('preHandler', requirePermission(product, 'profile:manage'));

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
  app.post<WithId>(
    '/:id/duplicate',
    {
      schema: { tags: ['profiles'], security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to duplicate profile' },
    },
    profileController.duplicate,
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
