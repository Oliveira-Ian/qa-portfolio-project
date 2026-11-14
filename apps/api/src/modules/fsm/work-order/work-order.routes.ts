import type { FastifyInstance, FastifyRequest } from 'fastify';
import {
  fsmListQuerySchema,
  workOrderItemWriteSchema,
  workOrderNoteSchema,
  workOrderRequestSchema,
  workOrderStatusChangeSchema,
} from '@oliveira/schemas';
import { docsOnlyValidatorCompiler } from '../../../plugins/openapi.js';
import { UnauthorizedError } from '../../../shared/errors.js';
import { sendSuccess } from '../../../shared/http.js';
import type { WithId } from '../../../shared/params.js';
import { parseOrThrow } from '../../../shared/validation.js';
import { requireAnyOf, requirePermission, resolvePermissions } from '../../auth/authorize.js';
import { fsmPlugin } from '../crud-routes.js';
import { workOrderService, type WorkOrderCaller } from './work-order.service.js';

/** The caller, with their FSM permissions — what the service decides with. */
async function callerOf(request: FastifyRequest): Promise<WorkOrderCaller> {
  if (!request.account) {
    throw new UnauthorizedError();
  }

  const permissions = await resolvePermissions(request, 'FSM');

  return {
    accountId: request.account.id,
    name: request.account.name,
    membershipId: request.access?.membership?.id ?? null,
    can: {
      view: permissions.has('work-order:view'),
      create: permissions.has('work-order:create'),
      edit: permissions.has('work-order:edit'),
      assign: permissions.has('work-order:assign'),
      changeStatus: permissions.has('work-order:change-status'),
      execute: permissions.has('work-order:execute'),
    },
  };
}

type WithItem = { Params: { id: string; itemId: string } };

/**
 * Work orders (`/api/fsm/work-orders`). Reading is open to whoever sees every
 * work order (`work-order:view`) and to technicians (`work-order:execute`),
 * who see only theirs — the service narrows it. Each change has its own
 * permission; the service adds what depends on the work order itself (is the
 * caller its technician? may it go to that status now?).
 */
export async function workOrderRoutes(app: FastifyInstance) {
  fsmPlugin(app);

  const security = [{ bearerAuth: [] }];
  const tags = ['work orders'];
  const read = requireAnyOf(
    requirePermission('FSM', 'work-order:view'),
    requirePermission('FSM', 'work-order:execute'),
  );

  app.get(
    '/',
    {
      preHandler: read,
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: { tags, querystring: fsmListQuerySchema, security },
      config: { errorMessage: 'Failed to list work orders' },
    },
    async (request, reply) =>
      sendSuccess(
        reply,
        200,
        await workOrderService.list(
          parseOrThrow(fsmListQuerySchema, request.query),
          request.query as Record<string, unknown>,
          await callerOf(request),
        ),
      ),
  );

  app.get(
    '/technicians',
    {
      preHandler: requireAnyOf(
        requirePermission('FSM', 'work-order:assign'),
        requirePermission('FSM', 'work-order:create'),
        requirePermission('FSM', 'work-order:edit'),
      ),
      schema: { tags, security },
      config: { errorMessage: 'Failed to list technicians' },
    },
    async (_request, reply) => sendSuccess(reply, 200, await workOrderService.technicians()),
  );

  app.get<WithId>(
    '/:id',
    {
      preHandler: read,
      schema: { tags, security },
      config: { errorMessage: 'Failed to get work order' },
    },
    async (request, reply) =>
      sendSuccess(
        reply,
        200,
        await workOrderService.getById(request.params.id, await callerOf(request)),
      ),
  );

  app.post(
    '/',
    {
      preHandler: requirePermission('FSM', 'work-order:create'),
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: { tags, body: workOrderRequestSchema, security },
      config: { errorMessage: 'Failed to create work order' },
    },
    async (request, reply) => {
      const { values, timezoneOffset } = parseOrThrow(workOrderRequestSchema, request.body);

      return sendSuccess(
        reply,
        201,
        await workOrderService.create(values, timezoneOffset, await callerOf(request)),
      );
    },
  );

  app.put<WithId>(
    '/:id',
    {
      preHandler: requirePermission('FSM', 'work-order:edit'),
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: { tags, body: workOrderRequestSchema, security },
      config: { errorMessage: 'Failed to update work order' },
    },
    async (request, reply) => {
      const { values, timezoneOffset } = parseOrThrow(workOrderRequestSchema, request.body);

      return sendSuccess(
        reply,
        200,
        await workOrderService.update(
          request.params.id,
          values,
          timezoneOffset,
          await callerOf(request),
        ),
      );
    },
  );

  app.post<WithId>(
    '/:id/status',
    {
      preHandler: requireAnyOf(
        requirePermission('FSM', 'work-order:change-status'),
        requirePermission('FSM', 'work-order:execute'),
      ),
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: { tags, body: workOrderStatusChangeSchema, security },
      config: { errorMessage: 'Failed to change the work order status' },
    },
    async (request, reply) =>
      sendSuccess(
        reply,
        200,
        await workOrderService.changeStatus(
          request.params.id,
          parseOrThrow(workOrderStatusChangeSchema, request.body),
          await callerOf(request),
        ),
      ),
  );

  app.post<WithId>(
    '/:id/notes',
    {
      preHandler: read,
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: { tags, body: workOrderNoteSchema, security },
      config: { errorMessage: 'Failed to add the note' },
    },
    async (request, reply) =>
      sendSuccess(
        reply,
        201,
        await workOrderService.addNote(
          request.params.id,
          parseOrThrow(workOrderNoteSchema, request.body).message,
          await callerOf(request),
        ),
      ),
  );

  app.post<WithId>(
    '/:id/items',
    {
      preHandler: requireAnyOf(
        requirePermission('FSM', 'work-order:edit'),
        requirePermission('FSM', 'work-order:execute'),
      ),
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: { tags, body: workOrderItemWriteSchema, security },
      config: { errorMessage: 'Failed to add the item' },
    },
    async (request, reply) =>
      sendSuccess(
        reply,
        201,
        await workOrderService.addItem(
          request.params.id,
          parseOrThrow(workOrderItemWriteSchema, request.body),
          await callerOf(request),
        ),
      ),
  );

  app.delete<WithItem>(
    '/:id/items/:itemId',
    {
      preHandler: requireAnyOf(
        requirePermission('FSM', 'work-order:edit'),
        requirePermission('FSM', 'work-order:execute'),
      ),
      schema: { tags, security },
      config: { errorMessage: 'Failed to remove the item' },
    },
    async (request, reply) =>
      sendSuccess(
        reply,
        200,
        await workOrderService.removeItem(
          request.params.id,
          request.params.itemId,
          await callerOf(request),
        ),
      ),
  );
}
