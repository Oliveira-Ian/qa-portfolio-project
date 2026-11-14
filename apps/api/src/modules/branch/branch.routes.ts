import type { FastifyInstance } from 'fastify';
import { branchWriteSchema } from '@oliveira/schemas';
import { sendSuccess } from '../../shared/http.js';
import { requireAnyOf, requirePermission } from '../auth/authorize.js';
import { fsmPlugin, registerCrudRoutes } from '../fsm/crud-routes.js';
import { branchService } from './branch.service.js';

/**
 * The company's branches (docs/adr/0013, addendum), managed inside a product
 * with that product's permissions — one table for every product, mounted per
 * product the way profiles are. Only the FSM mounts it today
 * (`/api/fsm/branches`); the ERP would mount it with its own `branch:*` keys.
 */
export async function fsmBranchRoutes(app: FastifyInstance) {
  fsmPlugin(app);

  // Before `/:id`: the active branches a work order may name.
  app.get(
    '/options',
    {
      preHandler: requireAnyOf(
        requirePermission('FSM', 'branch:view'),
        requirePermission('FSM', 'work-order:create'),
        requirePermission('FSM', 'work-order:edit'),
      ),
      schema: { tags: ['branches'], security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to list branches' },
    },
    async (_request, reply) => sendSuccess(reply, 200, await branchService.options()),
  );

  registerCrudRoutes(app, {
    tag: 'branches',
    service: branchService,
    writeSchema: branchWriteSchema,
    guards: {
      read: requirePermission('FSM', 'branch:view'),
      create: requirePermission('FSM', 'branch:create'),
      edit: requirePermission('FSM', 'branch:edit'),
      delete: requirePermission('FSM', 'branch:delete'),
    },
    deletedMessage: (count) => (count === 1 ? 'Branch deleted' : `${count} branches deleted`),
  });
}
