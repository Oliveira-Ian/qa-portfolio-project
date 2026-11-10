import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify from 'fastify';
import { createHash } from 'node:crypto';
import { corsOrigins, env } from './config/env.js';
import { loggerOptions } from './config/logger.js';
import { prisma } from './config/prisma.js';
import { accountRoutes, productAccountRoutes } from './modules/account/account.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { branchRoutes } from './modules/branch/branch.routes.js';
import { companyProfileRoutes } from './modules/company/company-profile.js';
import { companyRoutes } from './modules/company/company.routes.js';
import { gridPreferenceRoutes } from './modules/grid-preference/grid-preference.routes.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { permissionRoutes } from './modules/permission/permission.routes.js';
import { personRoutes } from './modules/person/person.routes.js';
import { profileRoutes } from './modules/profile/profile.routes.js';
import { registerErrorHandler } from './plugins/error-handler.js';
import { registerOpenApi } from './plugins/openapi.js';
import { registerRequestContext } from './plugins/request-context.js';
import { registerTraceIdHeader } from './plugins/trace-id-header.js';

/**
 * Composition root: it wires plugins and route modules together and owns
 * nothing else. Reading no environment of its own is deliberate — the app can
 * be built without a server or a port.
 */
export function buildApp() {
  const app = Fastify({ logger: loggerOptions, trustProxy: env.TRUST_PROXY });

  registerErrorHandler(app);
  // Before any route is registered: a hook only reaches the routes added after it.
  registerRequestContext(app);
  // Before the routes, so every response carries the header, errors included.
  registerTraceIdHeader(app);
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
  // Counted per session when there is one (a hash of the token — never the token
  // itself), otherwise per client address: every request arrives through the web
  // server, so keying by address alone would make all visitors share one budget.
  app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => {
      const authorization = request.headers.authorization;

      return authorization?.startsWith('Bearer ')
        ? `session:${createHash('sha256').update(authorization).digest('base64url')}`
        : `ip:${request.ip}`;
    },
  });

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
  app.register(accountRoutes, { prefix: '/api/accounts' });
  app.register(companyRoutes, { prefix: '/api/company' });
  app.register(companyProfileRoutes, { prefix: '/api/company/profile' });
  app.register(branchRoutes, { prefix: '/api/company/branches' });
  app.register(gridPreferenceRoutes, { prefix: '/api/grid-preferences' });

  // One product's profiles, catalog and members' profile links, registered per
  // product — the ERP's keep the prefixes they have always had.
  app.register(profileRoutes, { prefix: '/api/profiles', product: 'ERP' });
  app.register(permissionRoutes, { prefix: '/api/permissions', product: 'ERP' });
  app.register(productAccountRoutes, { prefix: '/api/accounts', product: 'ERP' });
  app.register(profileRoutes, { prefix: '/api/fsm/profiles', product: 'FSM' });
  app.register(permissionRoutes, { prefix: '/api/fsm/permissions', product: 'FSM' });
  app.register(productAccountRoutes, { prefix: '/api/fsm/accounts', product: 'FSM' });

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });

  return app;
}
