import type { FastifyInstance } from 'fastify';

/**
 * Deliberately outside the `{ success, data }` envelope: this is a liveness
 * probe for Docker Compose and the dev tooling, not part of the public API.
 */
export async function healthRoutes(app: FastifyInstance) {
  // `hide: true` — a liveness probe, not part of the documented API surface.
  app.get('/health', { schema: { hide: true } }, async () => ({ status: 'ok' }));
}
