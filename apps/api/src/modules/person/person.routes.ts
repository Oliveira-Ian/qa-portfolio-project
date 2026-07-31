import type { FastifyInstance } from 'fastify';
import {
  personCreateSchema,
  personDeleteManySchema,
  personListQuerySchema,
  personUpdateSchema,
} from '@oliveira/schemas';
import { docsOnlyValidatorCompiler } from '../../plugins/openapi.js';
import type { WithId } from '../../shared/params.js';
import { requireAuth } from '../auth/require-auth.js';
import { requirePermission } from '../auth/authorize.js';
import { personController } from './person.controller.js';

/**
 * Every person endpoint needs a session (`requireAuth`, plugin-wide) plus the
 * matching business permission (`requirePermission`, per route — ADMIN
 * accounts bypass it, everyone else needs a profile granting it). `errorMessage`
 * is the copy an unexpected failure answers with, declared per route so the
 * documented wording lives next to the handler it describes.
 *
 * `schema` + `validatorCompiler: docsOnlyValidatorCompiler` on every route:
 * documents the request shape for Swagger without changing how it's actually
 * validated (still `parseOrThrow(...)` in the controller) — see
 * `plugins/openapi.ts` for why.
 */
export async function personRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get(
    '/',
    {
      preHandler: requirePermission('person:view'),
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: {
        tags: ['persons'],
        querystring: personListQuerySchema,
        security: [{ bearerAuth: [] }],
      },
      config: { errorMessage: 'Failed to list persons' },
    },
    personController.list,
  );
  // A static route ahead of `/:id` — Fastify's router already prioritizes
  // static segments over parametric ones regardless of registration order,
  // but the ordering here still reads as "the more specific route first".
  app.get(
    '/summary',
    {
      preHandler: requirePermission('person:view'),
      schema: { tags: ['persons'], security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to load registry summary' },
    },
    personController.summary,
  );
  app.get<WithId>(
    '/:id',
    {
      preHandler: requirePermission('person:view'),
      schema: { tags: ['persons'], security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to get person' },
    },
    personController.getById,
  );
  app.post(
    '/',
    {
      preHandler: requirePermission('person:create'),
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: { tags: ['persons'], body: personCreateSchema, security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to create person' },
    },
    personController.create,
  );
  app.put<WithId>(
    '/:id',
    {
      preHandler: requirePermission('person:edit'),
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: { tags: ['persons'], body: personUpdateSchema, security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to update person' },
    },
    personController.update,
  );
  app.delete<WithId>(
    '/:id',
    {
      preHandler: requirePermission('person:delete'),
      schema: { tags: ['persons'], security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to delete person' },
    },
    personController.remove,
  );
  // A separate route rather than accepting `ids` on `/:id` — the two request
  // shapes (path param vs body) aren't worth conflating into one handler.
  app.delete(
    '/',
    {
      preHandler: requirePermission('person:delete'),
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: { tags: ['persons'], body: personDeleteManySchema, security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to delete people' },
    },
    personController.removeMany,
  );
}
