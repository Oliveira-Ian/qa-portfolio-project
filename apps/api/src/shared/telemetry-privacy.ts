import type { Span } from '@opentelemetry/api';

/**
 * The path of a request URL, without its query string. List endpoints take
 * their filters there (`f_name`, `f_document`, `search`), and those are
 * personal data: they must not reach a log line or a span.
 */
export function pathOf(url: string): string {
  return url.split('?')[0] ?? '';
}

/**
 * Keeps the query string off a request span. Both the HTTP instrumentation and
 * `@fastify/otel` record the URL on their span — the second one as `url.path`,
 * query included — so each is given this as its `requestHook`.
 *
 * The fact that there was a query is kept, its value is not.
 */
export function keepQueryOffSpan(span: Span, url: string | undefined): void {
  if (!url) {
    return;
  }

  span.setAttribute('url.path', pathOf(url));

  if (url.includes('?')) {
    span.setAttribute('url.query', '[redacted]');
  }
}
