import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { ZodType } from 'zod';
import { fsmDeleteManySchema, fsmListQuerySchema } from '@oliveira/schemas';
import { docsOnlyValidatorCompiler } from '../../plugins/openapi.js';
import { message, sendSuccess } from '../../shared/http.js';
import type { WithId } from '../../shared/params.js';
import { parseOrThrow } from '../../shared/validation.js';
import { requireAuth } from '../auth/require-auth.js';
import { requireProductAccess, type RouteGuard } from '../auth/authorize.js';

/**
 * The five endpoints every Oliveira FSM record has — list, read, create,
 * update, delete (in bulk, all or nothing) — wired the same way: a session
 * and an FSM seat for the whole plugin, then the record's own permission per
 * route (docs/adr/0018: no role is exempt). The record supplies its service
 * and its guards; the shape of the API is decided once, here.
 */
export interface CrudService<TWrite, TDto> {
  list(
    query: ReturnType<typeof fsmListQuerySchema.parse>,
    raw: Record<string, unknown>,
  ): Promise<unknown>;
  getById(id: string): Promise<TDto>;
  create(input: TWrite): Promise<TDto>;
  update(id: string, input: TWrite): Promise<TDto>;
  removeMany(ids: string[]): Promise<void>;
}

export interface CrudRouteOptions<TWrite, TDto> {
  /** OpenAPI tag and the noun of the error messages ("customer"). */
  tag: string;
  service: CrudService<TWrite, TDto>;
  writeSchema: ZodType<TWrite>;
  guards: { read: RouteGuard; create: RouteGuard; edit: RouteGuard; delete: RouteGuard };
  /** The confirmation of a bulk delete: "3 customers deleted". */
  deletedMessage: (count: number) => string;
}

export function fsmPlugin(app: FastifyInstance): void {
  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', requireProductAccess('FSM'));
}

export function registerCrudRoutes<TWrite, TDto>(
  app: FastifyInstance,
  { tag, service, writeSchema, guards, deletedMessage }: CrudRouteOptions<TWrite, TDto>,
): void {
  const security = [{ bearerAuth: [] }];

  app.get(
    '/',
    {
      preHandler: guards.read,
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: { tags: [tag], querystring: fsmListQuerySchema, security },
      config: { errorMessage: `Failed to list ${tag}` },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = parseOrThrow(fsmListQuerySchema, request.query);

      return sendSuccess(
        reply,
        200,
        await service.list(query, request.query as Record<string, unknown>),
      );
    },
  );

  app.get<WithId>(
    '/:id',
    {
      preHandler: guards.read,
      schema: { tags: [tag], security },
      config: { errorMessage: `Failed to get ${tag}` },
    },
    async (request, reply) => sendSuccess(reply, 200, await service.getById(request.params.id)),
  );

  app.post(
    '/',
    {
      preHandler: guards.create,
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: { tags: [tag], body: writeSchema, security },
      config: { errorMessage: `Failed to create ${tag}` },
    },
    async (request: FastifyRequest, reply: FastifyReply) =>
      sendSuccess(reply, 201, await service.create(parseOrThrow(writeSchema, request.body))),
  );

  app.put<WithId>(
    '/:id',
    {
      preHandler: guards.edit,
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: { tags: [tag], body: writeSchema, security },
      config: { errorMessage: `Failed to update ${tag}` },
    },
    async (request, reply) =>
      sendSuccess(
        reply,
        200,
        await service.update(request.params.id, parseOrThrow(writeSchema, request.body)),
      ),
  );

  app.delete(
    '/',
    {
      preHandler: guards.delete,
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: { tags: [tag], body: fsmDeleteManySchema, security },
      config: { errorMessage: `Failed to delete ${tag}` },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { ids } = parseOrThrow(fsmDeleteManySchema, request.body);
      await service.removeMany(ids);

      return sendSuccess(reply, 200, message(deletedMessage(ids.length)));
    },
  );
}

const orNull = (value: string): string | null => (value.trim() === '' ? null : value.trim());
export { orNull };

/** `yyyy-mm-dd` ↔ a `@db.Date` column, never shifted by a time zone. */
export function toDateColumn(day: string): Date | null {
  return day === '' ? null : new Date(`${day}T00:00:00.000Z`);
}

export function fromDateColumn(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}
