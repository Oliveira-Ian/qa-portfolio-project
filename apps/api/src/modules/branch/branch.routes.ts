import type { FastifyInstance } from 'fastify';
import { branchWriteSchema } from '@oliveira/schemas';
import { docsOnlyValidatorCompiler } from '../../plugins/openapi.js';
import type { WithId } from '../../shared/params.js';
import { requireAuth } from '../auth/require-auth.js';
import { requireCompanyAdmin, requireCompanyMember } from '../auth/authorize.js';
import { branchController } from './branch.controller.js';

/**
 * The caller's company's branches (docs/adr/0013, addendum). Any member reads
 * them — a work order may name one, whatever product it lives in; only the
 * company's administrator creates and edits them. No delete: a branch is
 * deactivated, so the records that name it keep their history.
 */
export async function branchRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get(
    '/',
    {
      preHandler: requireCompanyMember,
      schema: { tags: ['branches'], security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to list branches' },
    },
    branchController.list,
  );
  app.get<WithId>(
    '/:id',
    {
      preHandler: requireCompanyMember,
      schema: { tags: ['branches'], security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to get branch' },
    },
    branchController.getById,
  );
  app.post(
    '/',
    {
      preHandler: requireCompanyAdmin,
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: { tags: ['branches'], body: branchWriteSchema, security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to create branch' },
    },
    branchController.create,
  );
  app.put<WithId>(
    '/:id',
    {
      preHandler: requireCompanyAdmin,
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: { tags: ['branches'], body: branchWriteSchema, security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to update branch' },
    },
    branchController.update,
  );
}
