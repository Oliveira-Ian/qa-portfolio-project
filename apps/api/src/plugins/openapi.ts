import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';

/**
 * Documents the API straight from the same Zod schemas `packages/schemas`
 * already exports — one definition, not two copies that can drift apart —
 * without changing how any request is actually validated.
 *
 * Two things stay deliberately out of scope, both to avoid changing runtime
 * behaviour on an API whose exact response bodies are asserted by
 * `tests/api/*.spec.ts`:
 *
 * 1. **No live request validation.** Every route keeps using
 *    `docsOnlyValidatorCompiler` below (a no-op validator) instead of wiring
 *    Fastify to actually validate against the attached schema, and controllers keep
 *    their existing `parseOrThrow(...)` calls unchanged. The reason isn't
 *    only the auth routes' hand-written, order-sensitive messages — several
 *    schemas transform their input (`personQuerySchema.active`:
 *    string→boolean, `personCreateSchema.birthdate`: string→Date). If Fastify
 *    validated live, `request.body`/`request.query` would arrive already
 *    transformed, and the controller's own `parseOrThrow` re-parsing that
 *    *already-transformed* value against the *original* string-expecting
 *    schema would fail. Skipping live validation everywhere sidesteps that
 *    entirely rather than fixing it route by route.
 * 2. **No response schema**, anywhere. A response schema makes Fastify
 *    *serialize* through it, silently dropping any field the schema didn't
 *    list — a real risk to the documented envelope.
 *
 * The result is additive only: the running API behaves exactly as it did
 * before this file existed, and gets an accurate spec besides.
 */
export async function registerOpenApi(app: FastifyInstance) {
  await app.register(swagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'Oliveira ERP API',
        description:
          'Request shapes only — see docs/api/http_responses.md for the response envelope and exact error contract this spec does not capture on its own.',
        version: '0.1.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
    transform: jsonSchemaTransform,
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });
}

/**
 * A route-level `validatorCompiler` override — pass the function itself
 * (`validatorCompiler: docsOnlyValidatorCompiler`), never call it. Fastify
 * calls it once per route with schema info and expects back the actual
 * per-request validator; this one ignores that info and returns a validator
 * that accepts anything unchanged, leaving the attached schema purely
 * descriptive. See this file's top comment for why every route uses it.
 */
export function docsOnlyValidatorCompiler() {
  return (data: unknown) => ({ value: data });
}
