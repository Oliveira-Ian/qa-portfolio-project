import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify from 'fastify';
import { corsOrigins } from './config/env.js';
import { prisma } from './config/prisma.js';
import { accountRoutes } from './modules/account/account.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { gridPreferenceRoutes } from './modules/grid-preference/grid-preference.routes.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { permissionRoutes } from './modules/permission/permission.routes.js';
import { personRoutes } from './modules/person/person.routes.js';
import { profileRoutes } from './modules/profile/profile.routes.js';
import { registerErrorHandler } from './plugins/error-handler.js';
import { registerOpenApi } from './plugins/openapi.js';

/**
 * Composition root: it wires plugins and route modules together and owns
 * nothing else. Reading no environment of its own is deliberate — the app can
 * be built without a server or a port.
 */
export function buildApp() {
  const app = Fastify({ logger: true });

  registerErrorHandler(app);
  // `void`: buildApp() stays synchronous — Fastify queues `.register()` calls
  // made inside and resolves them before the app becomes ready, so nothing
  // here needs to be awaited at this call site.
  void registerOpenApi(app);

  // CSP off: Swagger UI (`/docs`) serves its own inline scripts/styles that
  // a default policy would block, and this API has no HTML surface of its
  // own for CSP to protect. Every other helmet header (X-Content-Type-Options,
  // X-Frame-Options, HSTS, …) still applies.
  app.register(helmet, { contentSecurityPolicy: false });

  // A generous ceiling for the whole API; `/api/auth/login` and `/api/auth/register`
  // set their own stricter `config.rateLimit` (see `auth.routes.ts`) — bcrypt
  // makes each login attempt costly enough on its own to be a CPU-exhaustion
  // vector, not just a brute-force one.
  app.register(rateLimit, { global: true, max: 100, timeWindow: '1 minute' });

  // @fastify/cors' default methods list is GET/HEAD/POST only — the person
  // endpoints need PUT/DELETE too, and the account endpoints PATCH, or the
  // browser's preflight rejects them (only surfaces with a real browser
  // fetch; curl and Playwright's API request context don't enforce CORS, so
  // this went unnoticed until now). `origin: corsOrigins` replaces the
  // previous unset option, which reflected whatever `Origin` header a
  // request sent rather than checking it against anything.
  app.register(cors, {
    origin: corsOrigins,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.register(healthRoutes);
  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(personRoutes, { prefix: '/api/persons' });
  app.register(profileRoutes, { prefix: '/api/profiles' });
  app.register(permissionRoutes, { prefix: '/api/permissions' });
  app.register(accountRoutes, { prefix: '/api/accounts' });
  app.register(gridPreferenceRoutes, { prefix: '/api/grid-preferences' });

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });

  return app;
}
