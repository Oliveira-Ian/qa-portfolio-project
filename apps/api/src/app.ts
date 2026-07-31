import cors from '@fastify/cors';
import Fastify from 'fastify';
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

  // @fastify/cors' default methods list is GET/HEAD/POST only — the person
  // endpoints need PUT/DELETE too, and the account endpoints PATCH, or the
  // browser's preflight rejects them (only surfaces with a real browser
  // fetch; curl and Playwright's API request context don't enforce CORS, so
  // this went unnoticed until now).
  app.register(cors, { methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] });

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
