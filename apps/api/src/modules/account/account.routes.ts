import type { FastifyInstance } from 'fastify';
import {
  accountCreateSchema,
  accountProfileLinkSchema,
  accountUpdateSchema,
} from '@oliveira/schemas';
import { docsOnlyValidatorCompiler } from '../../plugins/openapi.js';
import type { WithId } from '../../shared/params.js';
import { requireAuth } from '../auth/require-auth.js';
import { requireRole } from '../auth/authorize.js';
import { accountController, type WithProfileLink } from './account.controller.js';

/**
 * System administration — accounts, and their profile links (the "Controle
 * de Acesso"). Gated by the technical ADMIN role, not a business permission.
 */
export async function accountRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', requireRole('ADMIN'));

  app.get(
    '/',
    {
      schema: { tags: ['accounts'], security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to list accounts' },
    },
    accountController.list,
  );
  app.get<WithId>(
    '/:id',
    {
      schema: { tags: ['accounts'], security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to get account' },
    },
    accountController.getById,
  );
  app.post(
    '/',
    {
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: { tags: ['accounts'], body: accountCreateSchema, security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to create account' },
    },
    accountController.create,
  );
  app.patch<WithId>(
    '/:id',
    {
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: { tags: ['accounts'], body: accountUpdateSchema, security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to update account' },
    },
    accountController.update,
  );
  app.post<WithId>(
    '/:id/profiles',
    {
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: {
        tags: ['accounts'],
        body: accountProfileLinkSchema,
        security: [{ bearerAuth: [] }],
      },
      config: { errorMessage: 'Failed to link profile' },
    },
    accountController.linkProfile,
  );
  app.delete<WithProfileLink>(
    '/:id/profiles/:profileId',
    {
      schema: { tags: ['accounts'], security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to unlink profile' },
    },
    accountController.unlinkProfile,
  );
}
