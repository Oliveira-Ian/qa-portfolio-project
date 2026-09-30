import type { Span } from '@opentelemetry/api';
import type { ReadableSpan, SpanProcessor } from '@opentelemetry/sdk-trace-base';
import { registerOTel } from '@vercel/otel';

/**
 * The attributes on which Next and the fetch instrumentation record a URL. The
 * list pages send their search and column filters to the API in the query
 * string, so each of these can carry personal data.
 */
const URL_ATTRIBUTES = ['http.url', 'url.full', 'http.target', 'url.path'];

const withoutQuery = (value: string) => value.split('?')[0] ?? value;

/**
 * Takes the query string off every span's URL attributes and name as the span
 * starts (`fetch GET http://…/api/persons?f_name=…` is a span name too). It runs
 * before the exporter sees the span, and only uses the public span API.
 */
class QueryStringRedactor implements SpanProcessor {
  onStart(span: Span): void {
    const { attributes, name } = span as unknown as ReadableSpan;

    for (const key of URL_ATTRIBUTES) {
      const value = attributes[key];

      if (typeof value === 'string' && value.includes('?')) {
        span.setAttribute(key, withoutQuery(value));
      }
    }

    if (name.includes('?')) {
      span.updateName(withoutQuery(name));
    }
  }

  onEnd(): void {}

  forceFlush(): Promise<void> {
    return Promise.resolve();
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }
}

/**
 * Next calls `register()` once when the server starts. It gives the web app a
 * tracer of its own (Next's render and route spans, plus every server-side
 * `fetch`), and — the reason it exists — makes the `fetch` to the API carry a
 * `traceparent` header, so one trace runs from the page through the API to the
 * database.
 *
 * The exporter needs no code here: it reads `OTEL_EXPORTER_OTLP_ENDPOINT`
 * (default `http://localhost:4318`) and drops the data quietly when nothing is
 * listening. Traces only — the web app's logs stay on its console.
 */
export function register() {
  // Same variables and default as `lib/api/client.ts`, which is `server-only`
  // and so cannot be imported here.
  const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  const escapedApiUrl = apiUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  registerOTel({
    serviceName: 'oliveira-web',
    // `'auto'` is the exporter `registerOTel` builds from the OTEL_* variables;
    // the redactor goes first so the exporter never receives a query string.
    spanProcessors: [new QueryStringRedactor(), 'auto'],
    instrumentationConfig: {
      fetch: {
        // Only the API gets the header: propagating to every URL would hand the
        // trace id to any third party a future `fetch` reaches. The lookahead
        // stops `:3001` from also matching `:30010`.
        propagateContextUrls: [new RegExp(`^${escapedApiUrl}(?=[/?#]|$)`)],
      },
    },
  });
}
