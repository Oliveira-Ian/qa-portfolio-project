import type { FastifyInstance } from 'fastify';
import { memberAddSchema, memberUpdateSchema } from '@oliveira/schemas';
import { docsOnlyValidatorCompiler } from '../../plugins/openapi.js';
import type { WithId } from '../../shared/params.js';
import { requireCompanyAdmin } from '../auth/authorize.js';
import { requireAuth } from '../auth/require-auth.js';
import { companyController, type WithSeat } from './company.controller.js';

/**
 * The company's own administration — its members and their seats in the
 * contracted products. Every route is for the company's administrator
 * (`Membership.role = ADMIN`) and for nobody else: not `SUPER_ADMIN`, who
 * administers the Platform and not a company's people, and not a member who
 * happens to have an ERP seat. It needs no seat itself — administering a
 * company grants nothing in a product (docs/adr/0018).
 *
 * Everything is scoped to the caller's company by the request context; there is
 * no company id in any URL, so there is nothing to tamper with.
 */
export async function companyRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', requireCompanyAdmin);

  app.get(
    '/members',
    {
      schema: { tags: ['company'], security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to list company members' },
    },
    companyController.listMembers,
  );
  app.post(
    '/members',
    {
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: { tags: ['company'], body: memberAddSchema, security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to add member' },
    },
    companyController.addMember,
  );
  app.patch<WithId>(
    '/members/:id',
    {
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: { tags: ['company'], body: memberUpdateSchema, security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to update member' },
    },
    companyController.updateMember,
  );
  app.put<WithSeat>(
    '/members/:id/products/:product',
    {
      schema: { tags: ['company'], security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to grant access to the product' },
    },
    companyController.grantSeat,
  );
  app.delete<WithSeat>(
    '/members/:id/products/:product',
    {
      schema: { tags: ['company'], security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to revoke access to the product' },
    },
    companyController.revokeSeat,
  );
}
