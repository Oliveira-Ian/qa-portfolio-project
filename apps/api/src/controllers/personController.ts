import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ZodError } from 'zod';
import { personCreateSchema, personUpdateSchema } from '@oliveira/schemas';
import { personService } from '../services/personService.js';

// Person had no server-side validation in the legacy Express API (only the
// frontend validated it). This is a deliberate addition, not a preserved
// rule — see docs/api/http_responses.md for the documented contract.
function firstIssueMessage(error: ZodError) {
  return error.issues[0]?.message ?? 'Invalid data';
}

export const personController = {
  async list(
    request: FastifyRequest<{ Querystring: Record<string, string> }>,
    reply: FastifyReply,
  ) {
    try {
      const persons = await personService.findAll(request.query);
      return reply.send({ success: true, data: persons });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: 'Failed to list persons' });
    }
  },

  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const person = await personService.findById(request.params.id);

      if (!person) {
        return reply.status(404).send({ success: false, error: 'Person not found' });
      }

      return reply.send({ success: true, data: person });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: 'Failed to get person' });
    }
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parsed = personCreateSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: firstIssueMessage(parsed.error) });
    }

    try {
      await personService.create(parsed.data);
      return reply
        .status(201)
        .send({ success: true, data: { message: 'Person created successfully' } });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: 'Failed to create person' });
    }
  },

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parsed = personUpdateSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: firstIssueMessage(parsed.error) });
    }

    try {
      await personService.update(request.params.id, parsed.data);
      return reply.send({ success: true, data: { message: 'Person updated successfully' } });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: 'Failed to update person' });
    }
  },

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      await personService.delete(request.params.id);
      return reply.send({ success: true, data: { message: 'Person deleted successfully' } });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: 'Failed to delete person' });
    }
  },
};
