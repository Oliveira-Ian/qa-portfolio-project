import cors from '@fastify/cors';
import Fastify from 'fastify';
import { authRoutes } from './routes/auth.js';
import { personRoutes } from './routes/person.js';

export function buildApp() {
  const app = Fastify({ logger: true });

  // @fastify/cors' default methods list is GET/HEAD/POST only — the person
  // endpoints need PUT/DELETE too, or the browser's preflight rejects them
  // (only surfaces with a real browser fetch; curl/Playwright's API request
  // context don't enforce CORS, so this went unnoticed until now).
  app.register(cors, { methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS'] });
  app.get('/health', async () => ({ status: 'ok' }));
  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(personRoutes, { prefix: '/api/persons' });

  return app;
}
