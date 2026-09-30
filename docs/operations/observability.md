# Observability — logs, metrics and traces

How the API and the web app report what they are doing, and how to use it to find out why something
failed. For **local development and testing only**: nothing here is meant for a shared or production
environment. The reasoning behind the choices is in
[ADR 0017](../adr/0017-observability-opentelemetry-lgtm.md).

## What it is

```
apps/web  (Next, :3000) ──traceparent──▶  apps/api  (Fastify, :3001) ──▶  PostgreSQL
    │  traces                                  │  traces + metrics + logs
    └──────────────────┐        ┌──────────────┘        (OTLP over HTTP, port 4318)
                       ▼        ▼
                 ┌────────────────────────────────────────────┐
                 │  grafana/otel-lgtm — ONE container         │
                 │  Collector ─▶ Tempo  (traces)              │
                 │            ─▶ Prometheus (metrics)         │
                 │            ─▶ Loki   (logs)                │
                 │  Grafana  ── reads all three ──  :3002     │
                 └────────────────────────────────────────────┘
```

| Piece                 | What it does here                                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **OpenTelemetry**     | The instrumentation in the apps: creates spans, counts and measures, and ships them out. Vendor-neutral.             |
| **Collector**         | Receives what the apps push (OTLP) and routes each signal to its store. Part of the LGTM image.                      |
| **Tempo**             | Stores **traces**: one request as a tree of timed steps (page → API route → database query).                        |
| **Prometheus**        | Stores **metrics**: numbers over time (requests per second, latency histogram, logins). Queried with PromQL.        |
| **Loki**              | Stores **logs**: the API's log lines, searchable by level, status and `trace_id`.                                    |
| **Grafana**           | Where you look at all of it: Explore (ad-hoc queries), the dashboard, the alert rules.                              |

Prometheus stands in for Mimir (the "M" of LGTM): the image bundles it, and PromQL is the same.

The apps **push** their data; nothing scrapes them, and there is no `/metrics` endpoint. If the
container is not running, the apps behave exactly the same — the data is simply dropped.

## Start and stop

```bash
npm run obs:up      # starts the container (first run downloads ~900 MB)
npm run obs:down    # stops it; the data stays in the lgtm-data volume
```

Then start the apps as usual (`npm run dev -w apps/api`, `npm run dev -w apps/web`), or the full
Compose stack (`npm run docker:up`, which reaches the container by its service name). Grafana takes
about 30 seconds to be ready.

| What                       | Where                                                   |
| -------------------------- | ------------------------------------------------------- |
| Grafana                    | <http://localhost:3002> — no login (see Limitations)    |
| Dashboard                  | Dashboards > **Oliveira API - Overview**                |
| Alert rules                | Alerting > Alert rules > folder **Oliveira**            |
| OTLP receiver (the apps)   | `http://localhost:4318` (OTLP over HTTP)                |

The ports are published on `127.0.0.1` only. Loki, Tempo and Prometheus are not published at all.
`obs:down` keeps the collected data. To wipe it, stop the container and remove its volume:
`npm run obs:down`, then `docker volume rm qa-portfolio-project_lgtm-data`.

## What is collected

**Traces** — every request except `/health` and `/docs`:

- `oliveira-web`: Next's page render and route spans, and each server-side `fetch`.
- `oliveira-api`: the HTTP server span (`GET /api/persons/:id`, with `http.route` as the template),
  the Fastify `request` and `handler` spans, and the Prisma spans (`prisma:client:operation` and the
  `prisma:client:db_query` under it).
- `auth.verify_password`: the bcrypt comparison inside a login — the part of a login that takes time.
- The web app's `fetch` sends a `traceparent` header to the API, so both services share one trace.

**Metrics** — pushed every 15 seconds:

| Metric (as queried in Prometheus)                             | Type      | Labels                                                          |
| ------------------------------------------------------------- | --------- | --------------------------------------------------------------- |
| `http_server_request_duration_seconds` (`_bucket/_count/_sum`) | Histogram | `http_route`, `http_request_method`, `http_response_status_code` |
| `auth_login_attempts_total`                                   | Counter   | `outcome` = `success` \| `failure`                              |
| `person_changes_total`                                        | Counter   | `operation` = `create` \| `update` \| `delete`                  |

The duration histogram gives the request count (`_count`), the error rate (`_count` by status), the
latency percentiles (`histogram_quantile` over `_bucket`) and the duration distribution, all from one
series. There is no Gauge: nothing the API does today is a level that goes up and down. Every series
also has `job` / `service_name` = `oliveira-api`.

**Logs** — the API's pino output, one JSON object per line, on the console **and** in Loki:

```json
{"level":40,"time":"2026-09-30T04:04:19.483Z","service":"oliveira-api","env":"development",
 "reqId":"req-1","trace_id":"c0e8955e…","span_id":"07b534a4…","statusCode":401,
 "msg":"Invalid email or password"}
```

- Levels: `info` for the request lifecycle, `warn` for a client error the API refused through its
  error handler (400 validation, 401, 403, a `NotFoundError` 404 … with the reason in `msg`), `error`
  for a server error (5xx, with the stack). An unknown route (404) and a rate-limit rejection (429)
  do not get a `warn`: they show in the `request completed` line and in the metrics.
- `LOG_LEVEL` sets the minimum (`info` by default).
- `trace_id` / `span_id` appear only on lines written while a request is being traced.

## Check that it works

With the container and the API running:

```bash
# 1. The header is there (also on errors):
curl -i -X POST http://localhost:3001/api/auth/login -H 'content-type: application/json' \
  -d '{"email":"nobody@example.com","password":"wrong"}'
#    HTTP/1.1 401 Unauthorized
#    x-trace-id: c0e8955e1ad3a76a0c082daccb8ac5ba
```

2. **Traces:** Grafana > Explore > **Tempo**, query type **TraceQL**, paste that trace id. You see
   `POST /api/auth/login` with the Fastify spans, the Prisma query and `auth.verify_password`.
3. **Logs:** Explore > **Loki**, `{service_name="oliveira-api"} | trace_id="c0e8955e…"`. The 401 line
   is there, as a `warn`.
4. **Metrics:** Explore > **Prometheus**, `auth_login_attempts_total` — `outcome="failure"` went up by
   one. Metrics arrive up to 15 seconds late; the trace and log lines a few seconds after the request.
5. Open the **Oliveira API - Overview** dashboard: after a few requests every panel has data.

If nothing shows up: is the container healthy (`docker ps`)? Did you start the API **after** it
(exporters retry, but a stopped API sends nothing)? Is `OTEL_SDK_DISABLED` set? A response without an
`x-trace-id` header means telemetry is off in that process.

## Follow one request by its trace id

The trace id is the thread through all three signals.

- **From a response** — the `x-trace-id` header of any API response. Paste it into Tempo for the
  trace, into Loki (`| trace_id="…"`) for the log lines.
- **From a log line** — in Explore > Loki, expand a line: under **Links**, the `trace_id` field has a
  **Trace: …** button that opens the trace in Tempo beside the logs. (The dashboard's "Warnings and
  errors" panel works the same way.)
- **From a trace** — in Tempo, a span's **Logs for this span** button runs the Loki query for that
  service and trace.
- **From a route** — with no id, search Tempo with TraceQL. In Explore > Tempo, query type TraceQL:

```
{ span.http.route = "/api/auth/login" && span.http.response.status_code = 401 }
{ resource.service.name = "oliveira-api" && duration > 500ms }
{ span.http.response.status_code >= 500 }
{ resource.service.name = "oliveira-web" } && { resource.service.name = "oliveira-api" && span.http.route = "/api/persons" }
```

The last one finds the traces that cross from the web app into the API.

## Dashboard and alerts

**Oliveira API - Overview** (`infra/observability/grafana/dashboards/api-overview.json`), one page,
with a `Route` selector:

| Panel                           | Answers                                                                 |
| ------------------------------- | ----------------------------------------------------------------------- |
| Requests per second, by route   | Which routes are being used, and did the traffic change?                |
| Error rate                      | Share of 5xx (server broke) and 4xx (caller's mistake, no session, rate limit) |
| Latency percentiles             | p50 / p95 / p99 — is it slow for everyone or only the tail?             |
| Request duration distribution   | A heatmap of the buckets: a second band of slow requests shows here first |
| Login attempts, by outcome      | Success vs. failure — a spike in failures                               |
| Person changes, by operation    | Business activity: creates, updates, deletes                            |
| Warnings and errors             | The WARN/ERROR lines, each with the link to its trace                   |

**Alert rules** (`infra/observability/grafana/alerting.yaml`), evaluated every minute:

| Rule                      | Fires when                                                        | Why this way                                                                                                              |
| ------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| API error rate above 5%   | 5xx / all responses > 5% over 5 min, for 2 min                    | Ignored below 0.1 request/s: one failure among three requests is not a 33% problem.                                       |
| API p95 latency above 1s  | p95 > 1 s over 5 min, for 5 min, with the same traffic floor      | Login (bcrypt) is the slowest route and stays far below a second, so 1 s is a real slowdown. Longer `for`: latency is noisy. |
| API is not reporting      | No telemetry from the API for 2 min, for 1 min (about 4 min after it stops) | The apps push, so a stopped API is silence. Catches a stopped process, not a hung one.                                    |

They are visible in Alerting > Alert rules. No notification goes anywhere — there is no contact point
by design (no e-mail, chat or paging service at this stage).

The image also ships its own **RED Metrics** dashboards (rate, errors, duration per service, derived
from the traces); they need no setup.

## Investigating a failure — an example

*"`unknown credentials return 401` failed in the API tests: it got 500."*

1. **Reproduce with the header.** `curl -i` the same call, or read
   `response.headers()['x-trace-id']` in a scratch run (no spec has to change). Copy the id.
2. **Open the trace** (Tempo > paste the id). The red span is where it broke: the Fastify `request`
   span (and the HTTP span above it) carries the error, and its **exception** event holds the message
   and the stack. The Prisma spans next to it tell you which query was in flight.
3. **Read the log line** (Loki, `| trace_id="…"`): the `error` line has the same message and stack —
   for a database that is gone, `Database … does not exist on the database server`.
4. **Is it only this call?** On the dashboard, the Error rate panel shows whether 5xx are a spike or a
   single request; the `Route` selector narrows it to `/api/auth/login`.
5. **Fix, rerun, compare.** The new trace of the same call should be green, and the
   `auth_login_attempts_total` counters should move as expected (one `failure`).

For an **E2E** failure the browser only talks to the web app, and the web app's responses carry no
trace id. Take the time of the failure from the Playwright report and search Tempo for the page
route in that window — `{ resource.service.name = "oliveira-web" && name =~ "GET /records.*" }`. The
trace shows the page render, the `fetch` to the API and the queries behind it.

## Add a metric

Follow `apps/api/src/modules/auth/auth.metrics.ts`: create the instrument once at module level, expose
one small function, call it from the service.

```ts
import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('oliveira-api');
const profileChanges = meter.createCounter('profile.changes', {
  description: 'Access profiles created, updated or deleted',
  unit: '{profile}',
});

export function recordProfileChange(operation: 'create' | 'update' | 'delete'): void {
  profileChanges.add(1, { operation });
}
```

- Choose the type by what it is: a **Counter** only goes up (things that happened), a **Histogram**
  is a distribution (durations, sizes), a **Gauge** is a level (a queue's depth, a pool's connections).
- **Labels must be a small closed set** — a literal union like above. Never an id, e-mail, document,
  IP or raw URL: every distinct value is a new time series, and personal data has no place in a metric.
- In Prometheus the name becomes `profile_changes_total`. Add a panel by editing
  `infra/observability/grafana/dashboards/api-overview.json` (Grafana reloads the folder within
  seconds; export from the UI with Share > Export to get a starting JSON).

## Add a span

Most operations are already covered by the HTTP, Fastify and Prisma spans. Add one only for a step
that takes real time and is not a database query — the model is `auth.verify_password` in
`apps/api/src/modules/auth/password.ts`:

```ts
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('oliveira-api');

return tracer.startActiveSpan('report.render', async (span) => {
  try {
    return await render();
  } finally {
    span.end();
  }
});
```

`startActiveSpan` makes it a child of the current request's span. Attributes are optional; the same
rule as for labels applies (nothing that identifies a person).

## Configuration

All optional. The `OTEL_*` variables are read by the OpenTelemetry SDK itself, not validated by
`apps/api/src/config/env.ts`.

| Variable                       | Default                     | Effect                                                    |
| ------------------------------ | --------------------------- | --------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`  | `http://localhost:4318`     | Where to push. Compose sets `http://lgtm:4318`.           |
| `OTEL_SDK_DISABLED`            | unset                       | `true` turns telemetry off; no header, no data.           |
| `OTEL_SERVICE_NAME`            | `oliveira-api` / `oliveira-web` | The service name in every signal. It overrides the code, so one value exported in a shell renames both services. |
| `LOG_LEVEL` (API)              | `info`                      | `fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent`. |

Compose passes `OTEL_EXPORTER_OTLP_ENDPOINT` from your shell if it is set, so `docker compose up`
can point at a different collector.

## Privacy

- **The request log and every span have the path, never the query string** — list filters
  (`f_name`, `f_document`, `search`) are personal data. On the API, `url.path` keeps the path and
  `url.query` becomes `[redacted]` (`apps/api/src/shared/telemetry-privacy.ts`). On the web app, a
  span processor strips the query from the URL attributes and span names of the page and of the
  `fetch` to the API (`apps/web/instrumentation.ts`).
- **No client address in the log**, no headers; `authorization`, `cookie`, `password` and `token`
  are also redacted by name.
- What is logged for a refused request is a fixed string from `packages/schemas`, or Fastify's error
  code — never text derived from the caller's input (a JSON parser's message can quote the body it
  choked on). Keep it that way in new code: log ids and reasons, not values.
- The one thing not filtered is the text of an **unexpected** error (a 5xx): it comes from the library.
  A Prisma error quotes the source of the failing call and the reason, not the runtime values, but read
  a new kind of error once before trusting that it holds nothing personal.
- Metric labels and span attributes: see above. `client.address` is still recorded on the HTTP span
  (`127.0.0.1` locally) and would need dropping before any shared environment.

## Limitations

- Local development and testing only. No retention policy, no high availability, no authentication
  on Grafana (it opens as an anonymous admin — that is why the ports are bound to `127.0.0.1`), no
  external notifications.
- Metrics go to Prometheus, not Mimir.
- The availability alert cannot tell a hung process from a healthy one.
- The web app sends traces only; its logs stay on its console, and it has no metrics.
- An E2E failure is correlated by route and time, not by id.
- Prisma spans show the SQL with placeholders, not the parameter values.
- `node dist/server.js` without `--import ./dist/instrumentation.js` still runs, but the SDK then
  starts after Fastify and the HTTP module are loaded, so their spans are missing. Always start it
  with the preload.
- The API accepts a `traceparent` from any caller, so a caller can choose the trace id that
  `x-trace-id` echoes back. Fine for local use; not something to rely on elsewhere.

## Later

Not built, deliberately: the actor and company on every log line (F-18), a Playwright fixture that
attaches the `x-trace-id` to the test report, load-test metrics pushed to the same Prometheus, a
Collector of our own with sampling and filtering, and separate Mimir / Loki / Tempo when there is an
environment worth observing.
