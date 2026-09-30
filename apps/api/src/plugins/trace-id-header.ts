import { isSpanContextValid, trace } from '@opentelemetry/api';
import type { FastifyInstance } from 'fastify';

/**
 * Puts the trace id of the request in an `x-trace-id` response header.
 *
 * It is the handle that connects a failed request to everything recorded about
 * it: paste it into Tempo for the trace, into Loki for the log lines. A header
 * rather than a field of the body, so the `{ success, data | error }` envelope
 * that the API tests assert on stays exactly as it is.
 *
 * When telemetry is off (`OTEL_SDK_DISABLED`) there is no active span and no
 * header is added.
 */
export function registerTraceIdHeader(app: FastifyInstance) {
  app.addHook('onRequest', (_request, reply, done) => {
    const spanContext = trace.getActiveSpan()?.spanContext();

    if (spanContext && isSpanContextValid(spanContext)) {
      reply.header('x-trace-id', spanContext.traceId);
    }

    done();
  });
}
