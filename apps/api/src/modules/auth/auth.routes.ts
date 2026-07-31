import type { FastifyInstance } from 'fastify';
import { loginSchema, registerSchema } from '@oliveira/schemas';
import { docsOnlyValidatorCompiler } from '../../plugins/openapi.js';
import { authController } from './auth.controller.js';
import { requireAuth } from './require-auth.js';

// `errorMessage` is the body an unexpected failure answers with; the documented
// copy stays next to the route it belongs to instead of inside a catch block.
export async function authRoutes(app: FastifyInstance) {
  app.post(
    '/login',
    {
      // `docsOnlyValidatorCompiler`: the attached schema documents the shape
      // for Swagger only — see the function's own doc comment for why login
      // and register don't let Fastify validate against it for real.
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: { tags: ['auth'], body: loginSchema },
      // Stricter than the API-wide default (`app.ts`) — bcrypt makes each
      // attempt costly enough on its own that this is as much a CPU-exhaustion
      // guard as a brute-force one.
      config: { errorMessage: 'Server error', rateLimit: { max: 5, timeWindow: '1 minute' } },
    },
    authController.login,
  );
  app.post(
    '/register',
    {
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: { tags: ['auth'], body: registerSchema },
      config: { errorMessage: 'Server error', rateLimit: { max: 5, timeWindow: '1 minute' } },
    },
    authController.register,
  );
  app.get(
    '/me',
    {
      preHandler: requireAuth,
      schema: { tags: ['auth'], security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Server error' },
    },
    authController.me,
  );
}
