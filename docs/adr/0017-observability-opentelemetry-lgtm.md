# 0017 — Observability: OpenTelemetry pushed to one local `grafana/otel-lgtm` container

## Context

Until now the API wrote Fastify's default pino lines to its console and nothing else: no way to see
request rates, error rates or latency, and no way to follow one request from the page through the API
to the database. This is a QA portfolio, so the point is also to investigate a failed test with more
than its assertion message — the trace, the log lines and the metrics of the request that failed.

The stack has to be free, run on a laptop next to the apps, and stay small: ADR 0011 says nothing is
built ahead of a need, and there is no production environment to observe yet.

## Decision

**Instrument with OpenTelemetry and push everything over OTLP/HTTP to one optional container**,
`grafana/otel-lgtm` (pinned in `docker-compose.yml`): an OpenTelemetry Collector with Loki (logs),
Tempo (traces), Prometheus (metrics) and Grafana in a single image.

- **Prometheus, not Mimir.** The image bundles Prometheus as its metrics backend. Both are queried
  with PromQL, so the dashboard and the alerts do not change if Mimir replaces it in a real
  environment. Running Mimir now would mean five containers and five configuration files to maintain
  for a laptop.
- **The apps do not depend on it.** It sits behind the Compose profile `observability` (`npm run
  obs:up`), so `docker compose up` and the CI smoke test neither pull nor start it, and the apps carry
  no `depends_on` to it. With nothing listening, the exporters drop their data quietly.
  `OTEL_SDK_DISABLED=true` turns telemetry off.
- **`apps/api`** is instrumented in `instrumentation.ts`, preloaded with `node --import` so it runs
  before Fastify, pino and Prisma are loaded. An explicit list — HTTP, `@fastify/otel`, pino, Prisma —
  rather than `auto-instrumentations-node`, which patches dozens of libraries this API never loads.
  Not `instrumentation-pg` on top of Prisma: the same query would be a span twice.
- **Logs reuse Fastify's pino.** No second logger: the pino instrumentation adds `trace_id` and
  `span_id` to each line and forwards the lines to Loki. `config/logger.ts` only shapes them.
- **`apps/web`** gets traces only (`@vercel/otel`), and its `fetch` to the API carries a
  `traceparent`, so a page and the API calls behind it are one trace.
- **Every API response has an `x-trace-id` header.** A header, not a field of the body, so the
  `{ success, data | error }` envelope the API tests assert on is untouched. It is what connects a
  failed test to its trace and log lines.
- **Personal data stays out of telemetry.** List filters travel in the query string (`f_name`,
  `f_document`, …), so the request log carries the path only and the span's `url.query` is replaced by
  a marker. Metric labels are small closed sets (`outcome`, `operation`, the route *template*); never an
  id, an e-mail or a raw URL.
- **Local development and testing only.** Ports are published on `127.0.0.1`, and the Grafana in the
  image has no login.

## Consequences

- One more thing to know when adding a dependency that the API loads before the app: the
  instrumentations patch modules as they load, so `instrumentation.ts` must stay the first thing
  `node` runs (the `dev` and `start` scripts and the Dockerfile's `CMD` all pass `--import`). Running
  `node dist/server.js` directly still works, but the SDK starts too late to patch what is already
  loaded, so the HTTP and Fastify spans are missing.
- A new metric or span is a few lines next to the code that does the work
  (`modules/auth/auth.metrics.ts` is the model); a new dashboard panel is an edit to a JSON file under
  `infra/observability/grafana/`. Both are described in `docs/operations/observability.md`.
- The OpenTelemetry context and the request context of ADR 0016 both live on `AsyncLocalStorage` and
  do not interfere: one holds the current span, the other the actor.
- The availability alert can only tell that the API stopped reporting — it cannot tell a hung process
  from a healthy one. The web app has no metrics and no logs in Loki yet, and `client.address` stays on
  the span; both are fine for `localhost` and to be revisited before any shared environment.
- Moving to a real environment is a different decision (retention, authentication, sampling, a
  Collector of our own, Mimir/Loki/Tempo apart). None of it is built here.
