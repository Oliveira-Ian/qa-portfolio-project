import type { FastifyReply } from 'fastify';

/**
 * The response envelope from `docs/api/http_responses.md`, built in one place so
 * a handler can't accidentally ship a differently-shaped body.
 */
export interface SuccessBody<T> {
  success: true;
  data: T;
}

export interface ErrorBody {
  success: false;
  error: string;
}

export function sendSuccess<T>(reply: FastifyReply, statusCode: number, data: T) {
  return reply.status(statusCode).send({ success: true, data } satisfies SuccessBody<T>);
}

export function sendError(reply: FastifyReply, statusCode: number, error: string) {
  return reply.status(statusCode).send({ success: false, error } satisfies ErrorBody);
}

/** Most write endpoints answer with a bare confirmation message. */
export function message(text: string) {
  return { message: text };
}
