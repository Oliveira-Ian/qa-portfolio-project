import type { FastifyServerOptions } from 'fastify';
import { pathOf } from '../shared/telemetry-privacy.js';
import { env } from './env.js';

/**
 * Options for the pino logger Fastify creates. The logger itself is still
 * Fastify's — this only shapes what it writes: one JSON object per line, ISO
 * timestamps, the service and environment on every line, and nothing that
 * identifies a person or authenticates a request.
 *
 * `trace_id` / `span_id` are not set here: `instrumentation.ts` adds them to
 * each line while a request is being traced.
 */
export const loggerOptions: Exclude<FastifyServerOptions['logger'], boolean | undefined> = {
  level: env.LOG_LEVEL,
  base: { service: 'oliveira-api', env: env.NODE_ENV },
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
  // Fastify's default `req` serializer logs the whole URL and the client's
  // address. The URL carries list filters (name, document, …) and the address is
  // personal data, so this one keeps the method and the path only.
  serializers: {
    req: (request) => ({
      method: request.method,
      url: pathOf(request.url),
    }),
  },
  // Belt and braces: the serializer above already leaves headers out.
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
    censor: '[redacted]',
  },
};
