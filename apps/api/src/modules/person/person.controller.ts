import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  personCreateSchema,
  personDeleteManySchema,
  personListQuerySchema,
  personUpdateSchema,
} from '@oliveira/schemas';
import { message, sendSuccess } from '../../shared/http.js';
import type { WithId } from '../../shared/params.js';
import { parseOrThrow } from '../../shared/validation.js';
import { personService } from './person.service.js';

export const personController = {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const query = parseOrThrow(personListQuerySchema, request.query);
    const result = await personService.list(query, request.query as Record<string, unknown>);

    return sendSuccess(reply, 200, result);
  },

  async summary(_request: FastifyRequest, reply: FastifyReply) {
    return sendSuccess(reply, 200, await personService.summary());
  },

  async getById(request: FastifyRequest<WithId>, reply: FastifyReply) {
    return sendSuccess(reply, 200, await personService.getById(request.params.id));
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const input = parseOrThrow(personCreateSchema, request.body);
    await personService.create(input);

    return sendSuccess(reply, 201, message('Person created successfully'));
  },

  async update(request: FastifyRequest<WithId>, reply: FastifyReply) {
    const input = parseOrThrow(personUpdateSchema, request.body);
    await personService.update(request.params.id, input);

    return sendSuccess(reply, 200, message('Person updated successfully'));
  },

  async remove(request: FastifyRequest<WithId>, reply: FastifyReply) {
    await personService.remove(request.params.id);

    return sendSuccess(reply, 200, message('Person deleted successfully'));
  },

  async removeMany(request: FastifyRequest, reply: FastifyReply) {
    const input = parseOrThrow(personDeleteManySchema, request.body);
    await personService.removeMany(input.ids);

    return sendSuccess(
      reply,
      200,
      message(
        input.ids.length === 1 ? 'Person deleted successfully' : 'People deleted successfully',
      ),
    );
  },
};
