import type { FastifyInstance } from 'fastify';
import {
  accountCreateSchema,
  accountListQuerySchema,
  accountProfileLinkSchema,
  accountUpdateSchema,
} from '@oliveira/schemas';
import { docsOnlyValidatorCompiler } from '../../plugins/openapi.js';
import type { WithId } from '../../shared/params.js';
import { requireAuth } from '../auth/require-auth.js';
import {
  requireAnyOf,
  requireCompanyAdmin,
  requirePermission,
  requireProductAccess,
  requireRole,
} from '../auth/authorize.js';
import { accountController, type WithProfileLink } from './account.controller.js';

/**
 * Accounts and their profile links. Three different questions share this
 * prefix, so each route carries its own guard instead of one plugin-wide one
 * (docs/adr/0018):
 *
 * - who is in my company and which ERP profiles they hold — a seat in the ERP
 *   plus `profile:manage` (reading is also open to the company's administrator,
 *   who needs it to give a person of the registry a login);
 * - giving a person of the registry a login — the company's administrator;
 * - an account's global role and active flag — `SUPER_ADMIN`, the Platform's,
 *   who needs no seat for it.
 *
 * What concerns the ERP is scoped to the caller's company (`account.service.ts`).
 */
export async function accountRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get(
    '/',
    {
      preHandler: [
        requireProductAccess('ERP'),
        requireAnyOf(requirePermission('profile:manage'), requireCompanyAdmin),
      ],
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: {
        tags: ['accounts'],
        querystring: accountListQuerySchema,
        security: [{ bearerAuth: [] }],
      },
      config: { errorMessage: 'Failed to list accounts' },
    },
    accountController.list,
  );
  app.get<WithId>(
    '/:id',
    {
      preHandler: [
        requireProductAccess('ERP'),
        requireAnyOf(requirePermission('profile:manage'), requireCompanyAdmin),
      ],
      schema: { tags: ['accounts'], security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to get account' },
    },
    accountController.getById,
  );
  app.post(
    '/',
    {
      preHandler: [requireProductAccess('ERP'), requireCompanyAdmin],
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: { tags: ['accounts'], body: accountCreateSchema, security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to create account' },
    },
    accountController.create,
  );
  app.patch<WithId>(
    '/:id',
    {
      preHandler: requireRole('SUPER_ADMIN'),
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: { tags: ['accounts'], body: accountUpdateSchema, security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to update account' },
    },
    accountController.update,
  );
  app.post<WithId>(
    '/:id/profiles',
    {
      preHandler: [requireProductAccess('ERP'), requirePermission('profile:manage')],
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
      preHandler: [requireProductAccess('ERP'), requirePermission('profile:manage')],
      schema: { tags: ['accounts'], security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to unlink profile' },
    },
    accountController.unlinkProfile,
  );
}
