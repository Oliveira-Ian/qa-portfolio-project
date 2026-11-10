import type { FastifyInstance } from 'fastify';
import {
  accountCreateSchema,
  accountListQuerySchema,
  accountProfileLinkSchema,
  accountUpdateSchema,
} from '@oliveira/schemas';
import { docsOnlyValidatorCompiler } from '../../plugins/openapi.js';
import type { WithId } from '../../shared/params.js';
import type { ProductRouteOptions } from '../../shared/product-route.js';
import { requireAuth } from '../auth/require-auth.js';
import {
  requireAnyOf,
  requireCompanyAdmin,
  requirePermission,
  requireProductAccess,
  requireRole,
} from '../auth/authorize.js';
import {
  accountController,
  createProductAccountController,
  type WithProfileLink,
} from './account.controller.js';

/**
 * Accounts and their profile links. Different questions share these prefixes,
 * so each route carries its own guard instead of one plugin-wide one
 * (docs/adr/0018):
 *
 * - who is in my company and which of a product's profiles they hold — a seat
 *   in that product plus its `profile:manage` (in the ERP, reading is also open
 *   to the company's administrator, who needs it to give a person of the
 *   registry a login): `productAccountRoutes`, once per product;
 * - giving a person of the registry a login — the company's administrator;
 * - an account's global role and active flag — `SUPER_ADMIN`, the Platform's,
 *   who needs no seat for it.
 *
 * Everything is scoped to the caller's company (`account.service.ts`).
 */
export async function accountRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

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
}

/**
 * The company's members as one product sees them, and their profiles there —
 * `/api/accounts` for the ERP, `/api/fsm/accounts` for the FSM.
 */
export async function productAccountRoutes(app: FastifyInstance, { product }: ProductRouteOptions) {
  const controller = createProductAccountController(product);
  const canRead =
    product === 'ERP'
      ? requireAnyOf(requirePermission(product, 'profile:manage'), requireCompanyAdmin)
      : requirePermission(product, 'profile:manage');

  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', requireProductAccess(product));

  app.get(
    '/',
    {
      preHandler: canRead,
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: {
        tags: ['accounts'],
        querystring: accountListQuerySchema,
        security: [{ bearerAuth: [] }],
      },
      config: { errorMessage: 'Failed to list accounts' },
    },
    controller.list,
  );
  app.get<WithId>(
    '/:id',
    {
      preHandler: canRead,
      schema: { tags: ['accounts'], security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to get account' },
    },
    controller.getById,
  );
  app.post<WithId>(
    '/:id/profiles',
    {
      preHandler: requirePermission(product, 'profile:manage'),
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: {
        tags: ['accounts'],
        body: accountProfileLinkSchema,
        security: [{ bearerAuth: [] }],
      },
      config: { errorMessage: 'Failed to link profile' },
    },
    controller.linkProfile,
  );
  app.delete<WithProfileLink>(
    '/:id/profiles/:profileId',
    {
      preHandler: requirePermission(product, 'profile:manage'),
      schema: { tags: ['accounts'], security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to unlink profile' },
    },
    controller.unlinkProfile,
  );
}
