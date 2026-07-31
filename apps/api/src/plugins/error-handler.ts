import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '../shared/errors.js';
import { sendError } from '../shared/http.js';
import { firstIssueMessage } from '../shared/validation.js';

declare module 'fastify' {
  interface FastifyContextConfig {
    /** Copy for an unexpected 500 on this route — see `person.routes.ts`. */
    errorMessage?: string;
  }
}

/**
 * One place turns a thrown error into a response, which is what lets every
 * handler below stay free of try/catch. It also covers the two paths that used
 * to escape the envelope entirely: an unknown route and a malformed JSON body
 * both answered with Fastify's raw `{ statusCode, error, message }` shape.
 */
export function registerErrorHandler(app: FastifyInstance) {
  app.setNotFoundHandler((_request, reply) => sendError(reply, 404, 'Route not found'));

  app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof AppError) {
      return sendError(reply, error.statusCode, error.message);
    }

    if (error instanceof ZodError) {
      return sendError(reply, 400, firstIssueMessage(error));
    }

    const statusCode = error.statusCode ?? 500;

    // Fastify's own client-side errors (bad JSON, unsupported media type, …)
    // already carry a usable message; only reshape them into the envelope.
    if (statusCode < 500) {
      return sendError(reply, statusCode, error.message);
    }

    request.log.error(error);

    return sendError(reply, 500, request.routeOptions.config?.errorMessage ?? 'Server error');
  });
}
