import { Writable } from 'node:stream';
import { FastifyOtelInstrumentation } from '@fastify/otel';
import { context, propagation, trace } from '@opentelemetry/api';
import { node, tracing } from '@opentelemetry/sdk-node';
import Fastify from 'fastify';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { registerTraceIdHeader } from '../../apps/api/src/plugins/trace-id-header.js';
import { keepQueryOffSpan } from '../../apps/api/src/shared/telemetry-privacy.js';

/**
 * Observability guarantees that can be checked without a collector or a
 * database: the `x-trace-id` header names the real trace, and the log lines
 * carry neither the query string (list filters are personal data) nor the
 * client address nor a credential.
 *
 * `tracing` / `node` are the namespaces `@opentelemetry/sdk-node` re-exports;
 * they are marked deprecated there, but importing the packages behind them
 * directly would add dependencies just for this file.
 */
describe('x-trace-id header', () => {
  const exporter = new tracing.InMemorySpanExporter();
  const provider = new node.NodeTracerProvider({
    spanProcessors: [new tracing.SimpleSpanProcessor(exporter)],
  });

  beforeAll(() => {
    // Registers the global tracer provider, the async-local context manager and
    // the W3C propagator, the way `NodeSDK` does in `instrumentation.ts`.
    provider.register();
  });

  afterAll(async () => {
    await provider.shutdown();
    trace.disable();
    context.disable();
    propagation.disable();
  });

  async function buildTracedApp() {
    const app = Fastify();
    await app.register(new FastifyOtelInstrumentation().plugin());
    registerTraceIdHeader(app);
    app.get('/people/:id', async () => ({ ok: true }));
    return app;
  }

  it('is the id of the trace the request was recorded in', async () => {
    exporter.reset();
    const app = await buildTracedApp();

    const response = await app.inject({ method: 'GET', url: '/people/123' });

    const traceId = response.headers['x-trace-id'];
    expect(traceId).toMatch(/^[0-9a-f]{32}$/);

    const spans = exporter.getFinishedSpans();
    expect(spans.length).toBeGreaterThan(0);
    expect(spans.every((span) => span.spanContext().traceId === traceId)).toBe(true);

    await app.close();
  });

  it('records the route template, not the concrete path', async () => {
    exporter.reset();
    const app = await buildTracedApp();

    await app.inject({ method: 'GET', url: '/people/123' });
    await app.inject({ method: 'GET', url: '/people/456' });

    const routes = exporter
      .getFinishedSpans()
      .map((span) => span.attributes['http.route'])
      .filter(Boolean);

    expect(routes.length).toBeGreaterThan(0);
    expect(new Set(routes)).toEqual(new Set(['/people/:id']));

    await app.close();
  });

  it('keeps the query string, and so the list filters, off the request span', async () => {
    exporter.reset();
    const app = Fastify();
    await app.register(
      new FastifyOtelInstrumentation({
        // What `instrumentation.ts` gives `@fastify/otel`; without it the span
        // records `url.path` with the query string attached.
        requestHook: (span, request) => keepQueryOffSpan(span, request.url),
      }).plugin(),
    );
    app.get('/persons', async () => ({ ok: true }));

    await app.inject({ method: 'GET', url: '/persons?f_name=Maria&f_document=12345678901' });
    await app.close();

    const spans = exporter.getFinishedSpans();
    expect(spans.length).toBeGreaterThan(0);

    const everything = JSON.stringify(spans.map((span) => [span.name, span.attributes]));
    expect(everything).not.toContain('Maria');
    expect(everything).not.toContain('12345678901');

    const [requestSpan] = spans.filter((span) => span.attributes['url.path'] !== undefined);
    expect(requestSpan?.attributes['url.path']).toBe('/persons');
    expect(requestSpan?.attributes['url.query']).toBe('[redacted]');
  });

  it('is left out when there is no active span, instead of a made-up id', async () => {
    const app = Fastify();
    registerTraceIdHeader(app);
    app.get('/plain', async () => ({ ok: true }));

    const response = await app.inject({ method: 'GET', url: '/plain' });

    expect(response.headers['x-trace-id']).toBeUndefined();

    await app.close();
  });
});

describe('log lines', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('keep the path and drop the query string, the client address and credentials', async () => {
    // `config/logger.ts` reads the API environment; the schema only insists on this one.
    vi.stubEnv('DATABASE_URL', 'postgresql://user:password@localhost:5432/database');
    const { loggerOptions } = await import('../../apps/api/src/config/logger.js');

    const lines: string[] = [];
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        lines.push(String(chunk));
        callback();
      },
    });

    const app = Fastify({ logger: { ...loggerOptions, stream } });
    app.get('/persons', async () => ({ ok: true }));

    await app.inject({
      method: 'GET',
      url: '/persons?f_name=Maria&f_document=12345678901',
      headers: { authorization: 'Bearer secret-token', cookie: 'session=secret-cookie' },
    });
    await app.close();

    const output = lines.join('');
    expect(output).toContain('"url":"/persons"');
    expect(output).not.toContain('Maria');
    expect(output).not.toContain('12345678901');
    expect(output).not.toContain('secret-token');
    expect(output).not.toContain('secret-cookie');
    expect(output).not.toContain('remoteAddress');

    const [firstLine] = lines;
    const entry = JSON.parse(firstLine ?? '{}') as Record<string, unknown>;
    expect(entry).toMatchObject({ service: 'oliveira-api', env: 'test' });
    expect(new Date(String(entry.time)).toISOString()).toBe(entry.time);
  });
});
