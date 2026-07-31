import type { FastifyInstance } from 'fastify';
import { gridColumnPreferenceSaveSchema } from '@oliveira/schemas';
import { docsOnlyValidatorCompiler } from '../../plugins/openapi.js';
import { requireAuth } from '../auth/require-auth.js';
import { gridPreferenceController, type WithGridKey } from './grid-preference.controller.js';

/**
 * Only `requireAuth` — this is an account's own preference for its own
 * listing screens, not business data, so no `requirePermission`/`requireRole`
 * gate applies (every signed-in account manages its own grid preferences).
 */
export async function gridPreferenceRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get<WithGridKey>(
    '/:gridKey',
    {
      schema: { tags: ['grid-preferences'], security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to get grid preference' },
    },
    gridPreferenceController.get,
  );
  app.put<WithGridKey>(
    '/:gridKey',
    {
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: {
        tags: ['grid-preferences'],
        body: gridColumnPreferenceSaveSchema,
        security: [{ bearerAuth: [] }],
      },
      config: { errorMessage: 'Failed to save grid preference' },
    },
    gridPreferenceController.save,
  );
}
