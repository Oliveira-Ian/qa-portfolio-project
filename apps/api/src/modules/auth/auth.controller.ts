import type { FastifyReply, FastifyRequest } from 'fastify';
import { authMessages, validateLoginRequest, validateRegisterRequest } from '@oliveira/schemas';
import { BadRequestError } from '../../shared/errors.js';
import { message, sendSuccess } from '../../shared/http.js';
import { authService } from './auth.service.js';

/**
 * Validation lives in `packages/schemas` so `apps/web` enforces the same rules
 * in the same order. The controller only translates between HTTP and the
 * service — no try/catch here, `plugins/error-handler` renders every failure.
 */
export const authController = {
  async register(request: FastifyRequest, reply: FastifyReply) {
    const validation = validateRegisterRequest(request.body);

    if (!validation.success) {
      throw new BadRequestError(validation.error);
    }

    await authService.register(validation.data);

    return sendSuccess(reply, 201, message(authMessages.register.success));
  },

  async login(request: FastifyRequest, reply: FastifyReply) {
    const validation = validateLoginRequest(request.body);

    if (!validation.success) {
      throw new BadRequestError(validation.error);
    }

    const { token, user } = await authService.login(validation.data);

    return sendSuccess(reply, 200, {
      ...message(authMessages.login.success),
      token,
      user,
    });
  },

  /** `requireAuth` (wired at the route) guarantees `request.account` here. */
  async me(request: FastifyRequest, reply: FastifyReply) {
    const data = await authService.getMe(request.account!.id);
    return sendSuccess(reply, 200, data);
  },
};
