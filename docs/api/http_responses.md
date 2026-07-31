# HTTP Response Standardization

## Overview
This document defines the standardized HTTP response format for the QA Portfolio Project API. All endpoints must follow these patterns for consistency, maintainability, and ease of integration with frontend applications and testing tools like Postman and Cypress.

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data varies by endpoint
    "message": "Operation completed successfully",
    // or user object, list, etc.
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Clear, user-friendly error message"
}
```

## HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET operations, successful login |
| 201 | Created | Successful resource creation (user registration) |
| 400 | Bad Request | Validation errors (missing fields, invalid email, duplicate email) |
| 401 | Unauthorized | No valid session at all (missing/invalid/expired token, or credentials that don't authenticate) |
| 403 | Forbidden | A valid session that lacks the permission or role a route requires |
| 404 | Not Found | Resource not found, or an undefined route |
| 500 | Internal Server Error | Unexpected server errors |

All of the above — including a request to an undefined route and a duplicate-email registration — are rendered by one central error handler (`apps/api/src/plugins/error-handler.ts`), so nothing ever escapes the `{ success, error }` envelope. Earlier versions of this API let Fastify's default 404/malformed-JSON responses through unwrapped; that no longer happens.

## Implementation Guidelines

### Service Layer
Services return plain data and **throw** on failure — they never build a `{ success, ... }` envelope
themselves. Errors are one of `BadRequestError` / `UnauthorizedError` / `ForbiddenError` /
`NotFoundError` / `ConflictError` (`apps/api/src/shared/errors.ts`), each carrying its own HTTP
status code.

### Controller Layer
Controllers:
1. Parse/validate input with `parseOrThrow()` (`apps/api/src/shared/validation.ts`), which throws a
   `BadRequestError` carrying the first Zod issue message
2. Call service methods
3. Wrap a successful result with `sendSuccess(reply, statusCode, data)` (`apps/api/src/shared/http.ts`)

No controller has a `try/catch` — a thrown error propagates to the single error handler below, which
is the only place a status code and envelope shape are decided.

## API Endpoints

### POST /api/auth/register
**Request Body:**
```json
{
  "fullName": "string",
  "email": "string",
  "password": "string",
  "birthDate": "YYYY-MM-DD"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "message": "User created successfully"
  }
}
```

**Error Responses:**
- **400** (Missing fields):
```json
{
  "success": false,
  "error": "Please fill in all required fields"
}
```
- **400** (Invalid email):
```json
{
  "success": false,
  "error": "Invalid email"
}
```
- **400** (Email exists):
```json
{
  "success": false,
  "error": "Email already exists"
}
```
- **500** (Server error):
```json
{
  "success": false,
  "error": "Server error"
}
```

### POST /api/auth/login
**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Login successful",
    "token": "<JWT, 8h expiry>",
    "user": { "id": 1, "name": "string", "email": "string", "role": "string" }
  }
}
```

The password is verified against a bcrypt hash (`apps/api/src/modules/auth/password.ts`) — plaintext storage/comparison was removed. `apps/web` never sees the token in client JavaScript: the Server Action that calls this endpoint (`app/(auth)/login/_actions/login.ts`) puts it straight into an httpOnly session cookie.

**Error Responses:**
- **400** (Missing fields):
```json
{
  "success": false,
  "error": "Please fill in email and password"
}
```
- **400** (Invalid email format):
```json
{
  "success": false,
  "error": "Invalid email format"
}
```
- **401** (Invalid credentials):
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```
Also returned — with the exact same message, deliberately — for a deactivated account or one with role `SYSTEM` (reserved for integrations/jobs, never interactive login). The response never distinguishes *why* a login failed.
- **500** (Server error):
```json
{
  "success": false,
  "error": "Server error"
}
```

### GET /api/auth/me
Requires a session (`Authorization: Bearer <token>`). Returns the caller's own account, person and effective permissions — the piece a login response can't carry, since permissions are resolved from the account's `AccessProfile` links at read time, not baked into the JWT.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "account": { "id": 1, "personId": "uuid", "email": "string", "role": "ADMIN | USER | SYSTEM", "active": true },
    "person": { "id": "uuid", "name": "string" },
    "permissions": ["person:view", "person:create", "…"]
  }
}
```
`permissions` is whatever the account's profiles grant — an `ADMIN` account still gets its profile-derived list here (not "everything"); the technical bypass that lets `ADMIN` skip permission checks happens at authorization time, not in this response.

### Authentication and authorization

Every `/api/persons/*` route requires a session: `Authorization: Bearer <token>` from the login response. Missing or invalid tokens (expired, tampered, wrong signature) all answer identically:

```json
{ "success": false, "error": "Unauthorized" }
```
with status **401** — the response deliberately doesn't distinguish "no token" from "bad token", so it can't be used to probe the auth implementation. `apps/web` attaches this header server-side (`lib/api/persons.ts`); it is never sent from the browser.

Beyond having a session, each route requires a specific permission (`person:view` / `person:create` / `person:edit` / `person:delete` — see `packages/schemas/src/permissions.ts`), granted by at least one of the account's `AccessProfile`s. A session that's valid but lacks the permission gets:

```json
{ "success": false, "error": "Forbidden" }
```
with status **403**. `ADMIN`-role accounts bypass this check entirely — see `docs/product/access_control.md`.

### GET /api/persons
Requires `person:view`. Query params (all optional): `type` (`CLIENT`|`SUPPLIER`|`USER`|`EMPLOYEE` — matches persons whose `types` array **contains** this value, via Prisma's `has`), `active` (`true`|`false`), `search` (matches name or document).

**Success Response (200):**
```json
{
  "success": true,
  "data": [ /* array of Person */ ]
}
```

### GET /api/persons/:id
Requires `person:view`.

**Success Response (200):** `{ "success": true, "data": { /* Person */ } }`

**Error Responses:**
- **404**: `{ "success": false, "error": "Person not found" }`

### POST /api/persons
Requires `person:create`.

**Request Body:**
```json
{
  "name": "string",
  "types": "(CLIENT | SUPPLIER | USER | EMPLOYEE)[], at least one",
  "documentType": "CPF | CNPJ | null",
  "document": "string | null",
  "email": "string | null",
  "phone": "string | null",
  "birthdate": "YYYY-MM-DD | null",
  "active": "boolean (default true)",
  "street": "string | null",
  "city": "string | null",
  "state": "string | null",
  "zipCode": "string | null",
  "notes": "string | null"
}
```

A Person can hold more than one role at once — a company can be both a `CLIENT` and a `SUPPLIER` on
the same record (the "Party Role" pattern). `documentType`/`document` are only required when `types`
contains `CLIENT` or `SUPPLIER`; a person who is only `USER` (has an `AccessAccount` —
see `docs/product/domain.md`) or `EMPLOYEE` doesn't need a document to exist.

**Success Response (201):** `{ "success": true, "data": { "message": "Person created successfully" } }`

**Error Responses (400):** first validation issue found, e.g. `"Name is required"`,
`"At least one type is required"`, `"Document is required"`, `"Document type is required"`,
`"Invalid document format"` (CPF must have 11 digits, CNPJ 14), `"Invalid email"`.

> Person validation did not exist in the legacy Express API (only the frontend validated it). It was added during the Fastify migration as a single Zod schema shared with the frontend (`packages/schemas`) — see `docs/index.md`.

### PUT /api/persons/:id
Requires `person:edit`. Same body and validation as `POST /api/persons` — this is a full replace, not a patch.

**Success Response (200):** `{ "success": true, "data": { "message": "Person updated successfully" } }`
**Error Responses:** **404** `{ "success": false, "error": "Person not found" }` for an unknown id (previously a bare 500).

### DELETE /api/persons/:id
Requires `person:delete`.

**Success Response (200):** `{ "success": true, "data": { "message": "Person deleted successfully" } }`
**Error Responses:** **404** `{ "success": false, "error": "Person not found" }` for an unknown id (previously a bare 500).

### System administration — `/api/profiles`, `/api/permissions`, `/api/accounts`

All three require `Authorization: Bearer <token>` **and** the technical role `ADMIN`
(`requireRole('ADMIN')`) — not a business permission, and not bypassable by any `AccessProfile`. A
valid session with role `USER` gets the same `403 Forbidden` shape as a missing permission on
`/api/persons`. See `docs/product/access_control.md` for the role-vs-profile distinction.

### GET /api/permissions
The catalog, read-only — whatever's seeded from `packages/schemas/src/permissions.ts`.

**Success Response (200):**
```json
{ "success": true, "data": [ { "id": 1, "resource": "person", "action": "view", "label": "View people" } ] }
```

### GET /api/profiles
**Success Response (200):** `{ "success": true, "data": [ /* array of ProfileDto */ ] }`, each with a
nested `permissions` array (the full `PermissionDto`, not just ids).

### GET /api/profiles/:id
**Error Responses:** **404** `{ "success": false, "error": "Profile not found" }`

### POST /api/profiles / PUT /api/profiles/:id
**Request Body:**
```json
{ "name": "string", "description": "string | null", "permissionIds": "number[]" }
```
Unlike `/api/persons`, these return the full created/updated `ProfileDto` (id, permissions included) —
greenfield surface with no legacy "message only" contract to preserve, and the admin UI needs the id
right away. **Success Response:** **201** (POST) / **200** (PUT).

**Error Responses (400):** `"Name is required"`.

`isSystem`/`isDefault` are absent from the request body on purpose — they're seed-managed, not
admin-editable per profile. A system profile (`isSystem: true`) **can** still be renamed and have its
permissions changed; only deletion is blocked.

### DELETE /api/profiles/:id
**Success Response (200):** `{ "success": true, "data": { "message": "Profile deleted successfully" } }`
**Error Responses:**
- **404** `{ "success": false, "error": "Profile not found" }`
- **409** `{ "success": false, "error": "This profile is protected and cannot be deleted" }` — `isSystem: true`.

### GET /api/accounts
Query param `personId` (optional) filters to the one account belonging to that Person — used by the
Person edit page to check whether a USER-typed Person already has an account, without fetching every
account in the system.

**Success Response (200):**
```json
{
  "success": true,
  "data": [ {
    "id": 1, "personId": "uuid", "personName": "string", "email": "string",
    "role": "ADMIN | USER | SYSTEM", "active": true, "createdAt": "ISO 8601",
    "profiles": [ { "id": 1, "name": "string" } ]
  } ]
}
```

### GET /api/accounts/:id
**Error Responses:** **404** `{ "success": false, "error": "Account not found" }`

### POST /api/accounts
Admin-initiated account creation for an **existing** Person — distinct from `/api/auth/register`, which
creates the Person too. Adds `USER` to the Person's `types` if missing, and links the `isDefault`
profile, same as self-registration.

**Request Body:** `{ "personId": "uuid", "email": "string", "password": "string" }`
**Success Response (201):** the created `AccountDto` (see GET /api/accounts).
**Error Responses:**
- **404** `{ "success": false, "error": "Person not found" }`
- **409** `{ "success": false, "error": "This person already has an account" }` — `personId` already has one (unique).
- **409** `{ "success": false, "error": "Email already exists" }`

### PATCH /api/accounts/:id
**Request Body:** `{ "active": "boolean?", "role": "ADMIN | USER | SYSTEM"?" }` — at least one field.
**Success Response (200):** the updated `AccountDto`.
**Error Responses:**
- **404** `{ "success": false, "error": "Account not found" }`
- **409** — the last-admin lockout guard: an `ADMIN` demoting itself, or the last active `ADMIN` being
  deactivated/demoted by anyone. Message describes the specific rule tripped; see
  `apps/api/src/modules/account/account-guards.ts`.

### POST /api/accounts/:id/profiles
**Request Body:** `{ "profileId": "number" }`. Idempotent — linking an already-linked profile is not an error.
**Success Response (200):** the updated `AccountDto`.

### DELETE /api/accounts/:id/profiles/:profileId
**Success Response (200):** the updated `AccountDto`. Unlinking a profile that wasn't linked is not an error either.

### GET /api/grid-preferences/:gridKey
Requires only `Authorization: Bearer <token>` — no permission or role gate, since this is an account's
own preference for its own listing screens, not business data. `gridKey` is a screen-chosen identifier
(e.g. `person-list`); always scoped to the calling account, never another one's.

**Success Response (200):** `{ "success": true, "data": null }` if the account never saved a preference
for this grid, otherwise `{ "success": true, "data": { "gridKey": "string", "columns": [{ "key": "string", "visible": "boolean" }], "updatedAt": "string" } }`.
**Error Responses:** **400** `{ "success": false, "error": "Invalid grid key" }` if `gridKey` isn't
lowercase letters/digits/hyphens.

### PUT /api/grid-preferences/:gridKey
**Request Body:** `{ "columns": [{ "key": "string", "visible": "boolean" }] }` — the full ordered list
(array order **is** the column order); upserts, so the first save and every later one use the same call.
**Success Response (200):** the saved preference, same shape as the GET above.
**Error Responses:** **400** `"At least one column is required"` / `"Invalid grid key"`.

### GET /health
Outside the module structure and the `{ success, error }` envelope on purpose — it's a liveness probe for Docker Compose and the dev tooling, not a public API endpoint.

**Response (200):** `{ "status": "ok" }`

## Validation mechanism

Request validation is implemented with [Zod](https://zod.dev) schemas from `packages/schemas`, shared between `apps/api` (Fastify) and `apps/web` (Next.js) so client and server never validate differently:

- `/api/auth/*`: `validateLoginRequest`/`validateRegisterRequest` (`packages/schemas/src/auth.ts`) run the exact field-order checks documented above and are the single source of the message strings — both `apps/api`'s controller and `apps/web`'s inline field errors import from here instead of each keeping their own copy.
- `/api/persons/*`: validated by `personCreateSchema`/`personUpdateSchema`; the response `error` is the first Zod issue message.
- `/api/profiles/*`, `/api/accounts/*`: validated by `profileWriteSchema`/`accountCreateSchema`/`accountUpdateSchema`/`accountProfileLinkSchema` (`packages/schemas/src/access-control.ts`) — same "first issue message" convention.

Every route also attaches its Zod schema to Fastify purely as **OpenAPI documentation** — `docsOnlyValidatorCompiler` (`apps/api/src/plugins/openapi.ts`) makes Fastify skip live validation entirely and always defers to the controller's own `parseOrThrow()` call. This is deliberate, not an oversight: some schemas use `.transform()`/`.coerce()` (`personQuerySchema.active`, `personCreateSchema.birthdate`), and letting Fastify validate-and-transform the request *before* the controller re-parses the already-transformed value against the original schema would break — a boolean fed into a `z.string().transform(...)` fails the base type check. One validator, one set of error messages, documented in Swagger without a second, conflicting one at runtime.

## Error handling

`apps/api/src/plugins/error-handler.ts` is the only place a status code and message are decided for a thrown error — it turns an `AppError` (`shared/errors.ts`: `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`) into the matching envelope, and a `ZodError` into a 400 carrying the first issue message. Prisma's own error codes are *not* handled here — each repository (`person.repository.ts`, `profile.repository.ts`, `account.repository.ts`) translates `P2025` (record not found) into a `NotFoundError` and `P2002` (unique constraint) into a `ConflictError` right where the query runs, so the error handler never has to know Prisma exists. The one deliberate exception is registration's duplicate e-mail check, which is thrown as a 400 (`BadRequestError`) to match the table above rather than a generic 409.

## CORS

`apps/api` explicitly allows `GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS` (`apps/api/src/app.ts`). `@fastify/cors`'s own default only allows `GET`/`HEAD`/`POST` — the person endpoints' `PUT`/`DELETE` calls (and later, `/api/accounts/:id`'s `PATCH`) were silently blocked by the browser's preflight check until this was set explicitly. This only surfaces with a real browser `fetch` (curl and Playwright's API request context don't enforce CORS), which is why it wasn't caught until `apps/web`'s Person edit/delete flows were tested end-to-end in a browser. In practice `apps/web` never triggers this at all — it calls the API server-side, and CORS is a browser-only mechanism — but the header list should still match what the API actually exposes for any client that does call it from a browser.

`origin` is an explicit allowlist (`CORS_ORIGINS`, `apps/api/src/config/env.ts` — defaults to `http://localhost:3000`, `apps/web`'s own origin), not left unset. An unset `origin` makes `@fastify/cors` reflect whatever `Origin` header the request sends, which accepts a cross-origin browser request from anywhere; since nothing here actually needs that (see above), there was no reason to allow it.

## Rate limiting

`@fastify/rate-limit` (`apps/api/src/app.ts`) caps every route at 100 requests/minute per IP by default. `POST /api/auth/login` and `POST /api/auth/register` override that to 5/minute — bcrypt makes each login attempt costly enough on its own (`apps/api/src/modules/auth/password.ts`) that this is as much a CPU-exhaustion guard as a brute-force one. `GET /health` opts out entirely (`config: { rateLimit: false }`), since a liveness probe hitting it every few seconds shouldn't share a bucket with real traffic from the same IP. A request over the limit answers **429** with `@fastify/rate-limit`'s own body, outside the `{ success, error }` envelope — same category of infrastructure-level response as CORS, not a domain error `error-handler.ts` decides.

## Security headers

`@fastify/helmet` (`apps/api/src/app.ts`) sets the standard set (`X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, …) with `contentSecurityPolicy` turned off — Swagger UI (`/docs`) serves its own inline scripts/styles a default policy would block, and this API has no HTML surface of its own for a CSP to protect.

## Notes
- All error messages should be clear and actionable for users
- Frontend applications can rely on `success` boolean to handle responses
- Status codes provide additional context for programmatic handling
- This standardization ensures consistent behavior across all API endpoints