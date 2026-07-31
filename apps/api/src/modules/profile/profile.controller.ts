import type { FastifyReply, FastifyRequest } from 'fastify';
import { profileListQuerySchema, profileWriteSchema } from '@oliveira/schemas';
import { message, sendSuccess } from '../../shared/http.js';
import { parseId, type WithId } from '../../shared/params.js';
import { parseOrThrow } from '../../shared/validation.js';
import { profileService } from './profile.service.js';

export const profileController = {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const query = parseOrThrow(profileListQuerySchema, request.query);
    const result = await profileService.list(query, request.query as Record<string, unknown>);

    return sendSuccess(reply, 200, result);
  },

  async getById(request: FastifyRequest<WithId>, reply: FastifyReply) {
    return sendSuccess(reply, 200, await profileService.getById(parseId(request.params.id)));
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const input = parseOrThrow(profileWriteSchema, request.body);
    const profile = await profileService.create(input);

    return sendSuccess(reply, 201, profile);
  },

  async update(request: FastifyRequest<WithId>, reply: FastifyReply) {
    const input = parseOrThrow(profileWriteSchema, request.body);
    const profile = await profileService.update(parseId(request.params.id), input);

    return sendSuccess(reply, 200, profile);
  },

  async remove(request: FastifyRequest<WithId>, reply: FastifyReply) {
    await profileService.remove(parseId(request.params.id));
    return sendSuccess(reply, 200, message('Profile deleted successfully'));
  },
};
