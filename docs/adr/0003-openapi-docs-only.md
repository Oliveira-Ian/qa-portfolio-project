# 0003 — OpenAPI documents the API; it doesn't validate it

## Context

`apps/api/src/plugins/openapi.ts` generates Swagger UI (`/docs`) straight from the same Zod schemas
`packages/schemas` already exports. Fastify's own `fastify-type-provider-zod` integration can also
use those schemas to *validate* incoming requests automatically, which looks like the obvious thing
to also turn on.

Turning it on breaks existing routes, though. Several schemas transform their input —
`personQuerySchema.active` (string → boolean), `personCreateSchema.birthdate` (string → Date). If
Fastify validates-and-transforms the request before the controller runs, `request.body`/`request.query`
arrive already transformed. Every controller already calls `parseOrThrow(schema, request.body)`
itself; re-parsing an *already-transformed* value against the *original*, string-expecting schema
fails immediately (a boolean fed into `z.string().transform(...)` fails the base type check). The
auth routes have a second, independent reason: `validateLoginRequest`/`validateRegisterRequest` do
hand-written, order-sensitive field checks (missing fields reported before a malformed email, even
if both are wrong) that a generic schema-validate step can't reproduce.

## Decision

Every route attaches its Zod schema to Fastify for **documentation only** —
`docsOnlyValidatorCompiler` (`apps/api/src/plugins/openapi.ts`) is a `validatorCompiler` override
that accepts any input unchanged, so Fastify never validates against the attached schema at
request time. The schema still describes the request shape in `/docs`/`/docs/json`; it's just not
wired to reject anything. Live validation stays exactly where it was: each controller's own
`parseOrThrow(...)` call.

No response schema is attached either, anywhere — a response schema makes Fastify *serialize*
through it, silently dropping any field the schema didn't list. That's a real risk to the documented
`{ success, data }` envelope, for no offsetting benefit here.

## Consequences

- `/docs` is accurate documentation of request shapes, generated from the same source the API
  actually runs — but reading the OpenAPI spec doesn't tell you the exact error message/status code
  for a given failure; `docs/api/http_responses.md` is still the source for that.
- The running API's behavior is unchanged by adding OpenAPI at all — this was an additive
  documentation layer, not a validation rewrite. Nothing in `tests/api/*` needed to change when it
  was introduced.
- If a future schema *doesn't* need `.transform()`/`.coerce()`, live validation would be safe to
  enable for that one route — but there's no per-route toggle today; it's all-or-nothing via
  `docsOnlyValidatorCompiler`, deliberately, to avoid two different behaviors across routes.
