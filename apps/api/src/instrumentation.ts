/**
 * OpenTelemetry bootstrap. It is preloaded with `node --import` (see the `dev`
 * and `start` scripts and the Dockerfile) so the instrumentations are in place
 * before Fastify, pino and Prisma are first loaded — a module loaded earlier
 * can no longer be patched. Nothing in the application imports this file except
 * `server.ts`, for the shutdown call.
 *
 * It reads `process.env` itself rather than `config/env.ts`: the `OTEL_*`
 * variables belong to the SDK, and importing `env.ts` here would load the
 * application configuration before telemetry exists. Everything is optional —
 * with no collector listening the exporters fail quietly and the API runs the
 * same; `OTEL_SDK_DISABLED=true` turns the whole thing off.
 *
 * Why these instrumentations and not `auto-instrumentations-node`: that bundle
 * patches dozens of libraries this API never loads. Specification of the
 * decision: `docs/adr/0017-observability-opentelemetry-lgtm.md`.
 */
import 'dotenv/config';
import { FastifyOtelInstrumentation } from '@fastify/otel';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { logs, metrics, NodeSDK, resources } from '@opentelemetry/sdk-node';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { keepQueryOffSpan, pathOf } from './shared/telemetry-privacy.js';

// The stable HTTP semantic conventions: `url.path` / `url.query` / `http.route`
// and the `http.server.request.duration` histogram in seconds. The legacy set
// puts the full URL, query string included, on every span and records the
// duration in milliseconds. Must be set before the instrumentation is built.
process.env.OTEL_SEMCONV_STABILITY_OPT_IN ??= 'http';

const SERVICE_NAME = process.env.OTEL_SERVICE_NAME ?? 'oliveira-api';

// Probes and the API docs are noise in a trace list and in the request rate.
const isQuietPath = (url: string | undefined) => {
  const path = url === undefined ? undefined : pathOf(url);
  return path === '/health' || path?.startsWith('/docs') === true;
};

const sdk = new NodeSDK({
  resource: resources.resourceFromAttributes({
    'service.name': SERVICE_NAME,
    'deployment.environment.name': process.env.NODE_ENV ?? 'development',
  }),
  traceExporter: new OTLPTraceExporter(),
  metricReader: new metrics.PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter(),
    exportIntervalMillis: 15_000,
  }),
  logRecordProcessors: [new logs.BatchLogRecordProcessor({ exporter: new OTLPLogExporter() })],
  instrumentations: [
    new HttpInstrumentation({
      ignoreIncomingRequestHook: (request) => isQuietPath(request.url),
      // List endpoints take filters in the query string (name, document, …), and
      // those are personal data: keep the fact that there was one, not its value.
      requestHook: (span, request) => {
        if ('url' in request) {
          keepQueryOffSpan(span, request.url);
        }
      },
    }),
    // Names the Fastify route (`http.route`, e.g. `/api/persons/:id`) on the HTTP
    // span and its metrics, which is what keeps the metric's cardinality bounded.
    new FastifyOtelInstrumentation({
      registerOnInitialization: true,
      ignorePaths: ({ url }) => isQuietPath(url),
      // One span per hook (helmet, cors, …) would bury the handler and the
      // queries; the request and handler spans are enough.
      instrumentHooks: false,
      // Its `request` span records `url.path` with the query string attached.
      requestHook: (span, request) => keepQueryOffSpan(span, request.url),
    }),
    // Adds `trace_id` / `span_id` to every pino line, and forwards the lines to
    // the collector as OTLP logs (the SDK above supplies the log pipeline).
    new PinoInstrumentation(),
    // Spans for Prisma operations and their queries. Not `instrumentation-pg`
    // as well: the same query would appear twice.
    new PrismaInstrumentation(),
  ],
});

sdk.start();

const SHUTDOWN_TIMEOUT_MS = 2_000;

/**
 * Flushes what is still buffered. Called by `server.ts` once the app has closed.
 * A collector that is not there must not hold up a clean stop (Docker gives a
 * container ten seconds) or turn it into a failure, so this waits a couple of
 * seconds at most and never throws.
 */
export async function shutdownTelemetry(): Promise<void> {
  const giveUp = new Promise<void>((resolve) => {
    setTimeout(resolve, SHUTDOWN_TIMEOUT_MS).unref();
  });

  await Promise.race([sdk.shutdown().catch(() => undefined), giveUp]);
}
