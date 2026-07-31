import type { FastifyInstance } from 'fastify';

/**
 * Deliberately outside the `{ success, data }` envelope: this is a liveness
 * probe for Docker Compose and the dev tooling, not part of the public API.
 */
export async function healthRoutes(app: FastifyInstance) {
  // `hide: true` — a liveness probe, not part of the documented API surface.
  // `rateLimit: false` — a probe hitting this every few seconds shouldn't
  // share a bucket with real traffic from the same IP.
  app.get('/health', { schema: { hide: true }, config: { rateLimit: false } }, async () => ({
    status: 'ok',
  }));
}
