import type { FastifyReply, FastifyRequest } from 'fastify';
import { profileListQuerySchema, profileWriteSchema, type Product } from '@oliveira/schemas';
import { message, sendSuccess } from '../../shared/http.js';
import { parseId, type WithId } from '../../shared/params.js';
import { parseOrThrow } from '../../shared/validation.js';
import { profileService } from './profile.service.js';

/** Handlers for one product's profiles — the product is the route's, see `profile.routes.ts`. */
export function createProfileController(product: Product) {
  return {
    async list(request: FastifyRequest, reply: FastifyReply) {
      const query = parseOrThrow(profileListQuerySchema, request.query);
      const result = await profileService.list(
        product,
        query,
        request.query as Record<string, unknown>,
      );

      return sendSuccess(reply, 200, result);
    },

    async getById(request: FastifyRequest<WithId>, reply: FastifyReply) {
      return sendSuccess(
        reply,
        200,
        await profileService.getById(product, parseId(request.params.id)),
      );
    },

    async create(request: FastifyRequest, reply: FastifyReply) {
      const input = parseOrThrow(profileWriteSchema, request.body);

      return sendSuccess(reply, 201, await profileService.create(product, input));
    },

    async update(request: FastifyRequest<WithId>, reply: FastifyReply) {
      const input = parseOrThrow(profileWriteSchema, request.body);
      const profile = await profileService.update(product, parseId(request.params.id), input);

      return sendSuccess(reply, 200, profile);
    },

    async duplicate(request: FastifyRequest<WithId>, reply: FastifyReply) {
      return sendSuccess(
        reply,
        201,
        await profileService.duplicate(product, parseId(request.params.id)),
      );
    },

    async remove(request: FastifyRequest<WithId>, reply: FastifyReply) {
      await profileService.remove(product, parseId(request.params.id));
      return sendSuccess(reply, 200, message('Profile deleted successfully'));
    },
  };
}
