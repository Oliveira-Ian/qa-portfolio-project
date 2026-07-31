import type { FastifyReply, FastifyRequest } from 'fastify';
import { gridColumnPreferenceSaveSchema } from '@oliveira/schemas';
import { sendSuccess } from '../../shared/http.js';
import { parseOrThrow } from '../../shared/validation.js';
import { BadRequestError } from '../../shared/errors.js';
import { gridPreferenceService } from './grid-preference.service.js';

export type WithGridKey = { Params: { gridKey: string } };

// Screen-chosen identifiers only (e.g. "person-list") — never used to build a
// path or query, but kept narrow so nothing unexpected ends up as a row key.
const GRID_KEY_PATTERN = /^[a-z0-9-]+$/;

function parseGridKey(raw: string): string {
  if (!GRID_KEY_PATTERN.test(raw)) {
    throw new BadRequestError('Invalid grid key');
  }

  return raw;
}

export const gridPreferenceController = {
  /** `requireAuth` (wired at the route) guarantees `request.account` here. */
  async get(request: FastifyRequest<WithGridKey>, reply: FastifyReply) {
    const gridKey = parseGridKey(request.params.gridKey);
    const preference = await gridPreferenceService.get(request.account!.id, gridKey);

    return sendSuccess(reply, 200, preference);
  },

  async save(request: FastifyRequest<WithGridKey>, reply: FastifyReply) {
    const gridKey = parseGridKey(request.params.gridKey);
    const input = parseOrThrow(gridColumnPreferenceSaveSchema, request.body);
    const preference = await gridPreferenceService.save(request.account!.id, gridKey, input);

    return sendSuccess(reply, 200, preference);
  },
};
