import { registerOTel } from '@vercel/otel';

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

  registerOTel({
    serviceName: 'oliveira-web',
    instrumentationConfig: {
      fetch: {
        // Only the API gets the header: propagating to every URL would hand the
        // trace id to any third party a future `fetch` reaches.
        propagateContextUrls: [new RegExp(`^${apiUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)],
      },
    },
  });
}
