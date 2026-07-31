import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  accountCreateSchema,
  accountListQuerySchema,
  accountProfileLinkSchema,
  accountUpdateSchema,
} from '@oliveira/schemas';
import { sendSuccess } from '../../shared/http.js';
import { parseId, type WithId, type WithParams } from '../../shared/params.js';
import { parseOrThrow } from '../../shared/validation.js';
import { accountService } from './account.service.js';

export type WithProfileLink = WithParams<'id' | 'profileId'>;

export const accountController = {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const query = parseOrThrow(accountListQuerySchema, request.query);
    const result = await accountService.list(query, request.query as Record<string, unknown>);

    return sendSuccess(reply, 200, result);
  },

  async getById(request: FastifyRequest<WithId>, reply: FastifyReply) {
    return sendSuccess(reply, 200, await accountService.getById(parseId(request.params.id)));
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const input = parseOrThrow(accountCreateSchema, request.body);
    return sendSuccess(reply, 201, await accountService.create(input));
  },

  /** `requireRole('ADMIN')` (wired at the route) guarantees `request.account` here. */
  async update(request: FastifyRequest<WithId>, reply: FastifyReply) {
    const input = parseOrThrow(accountUpdateSchema, request.body);
    const account = await accountService.update(
      parseId(request.params.id),
      request.account!.id,
      input,
    );

    return sendSuccess(reply, 200, account);
  },

  async linkProfile(request: FastifyRequest<WithId>, reply: FastifyReply) {
    const input = parseOrThrow(accountProfileLinkSchema, request.body);
    const account = await accountService.linkProfile(parseId(request.params.id), input.profileId);

    return sendSuccess(reply, 200, account);
  },

  async unlinkProfile(request: FastifyRequest<WithProfileLink>, reply: FastifyReply) {
    const account = await accountService.unlinkProfile(
      parseId(request.params.id),
      parseId(request.params.profileId),
    );

    return sendSuccess(reply, 200, account);
  },
};
