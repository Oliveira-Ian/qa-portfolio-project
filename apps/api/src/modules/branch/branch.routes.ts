import type { FastifyInstance } from 'fastify';
import { branchWriteSchema } from '@oliveira/schemas';
import { docsOnlyValidatorCompiler } from '../../plugins/openapi.js';
import type { WithId } from '../../shared/params.js';
import { requireAuth } from '../auth/require-auth.js';
import { requireAnyOf, requirePermission, requireProductAccess } from '../auth/authorize.js';
import { branchController } from './branch.controller.js';

/**
 * The company's branches (docs/adr/0013, addendum), managed inside a product
 * with that product's permissions — one table for every product, mounted per
 * product the way profiles are. Only the FSM mounts it today
 * (`/api/fsm/branches`); the ERP would mount it with its own `branch:*` keys.
 *
 * Reading the list is also open to whoever creates or edits work orders: a
 * work order may name a branch.
 */
export async function fsmBranchRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', requireProductAccess('FSM'));

  app.get(
    '/',
    {
      preHandler: requireAnyOf(
        requirePermission('FSM', 'branch:view'),
        requirePermission('FSM', 'work-order:create'),
        requirePermission('FSM', 'work-order:edit'),
      ),
      schema: { tags: ['branches'], security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to list branches' },
    },
    branchController.list,
  );
  app.get<WithId>(
    '/:id',
    {
      preHandler: requirePermission('FSM', 'branch:view'),
      schema: { tags: ['branches'], security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to get branch' },
    },
    branchController.getById,
  );
  app.post(
    '/',
    {
      preHandler: requirePermission('FSM', 'branch:create'),
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: { tags: ['branches'], body: branchWriteSchema, security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to create branch' },
    },
    branchController.create,
  );
  app.put<WithId>(
    '/:id',
    {
      preHandler: requirePermission('FSM', 'branch:edit'),
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: { tags: ['branches'], body: branchWriteSchema, security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to update branch' },
    },
    branchController.update,
  );
  app.delete<WithId>(
    '/:id',
    {
      preHandler: requirePermission('FSM', 'branch:delete'),
      schema: { tags: ['branches'], security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to delete branch' },
    },
    branchController.remove,
  );
}
