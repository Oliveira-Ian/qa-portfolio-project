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
| 401 | Unauthorized | Authentication failures (invalid credentials) |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Unexpected server errors |

## Implementation Guidelines

### Service Layer
Services return standardized objects:
- Success: `{ success: true, data: result }`
- Error: `{ success: false, error: "message" }`

### Controller Layer
Controllers:
1. Perform input validation (return 400 for invalid input)
2. Call service methods
3. Return appropriate HTTP status based on service result
4. Format JSON response using service result

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
    "message": "Login successful"
  }
}
```

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
- **500** (Server error):
```json
{
  "success": false,
  "error": "Server error"
}
```

### GET /api/persons
Query params (all optional): `type` (`CLIENT`|`SUPPLIER`), `active` (`true`|`false`), `search` (matches name or document).

**Success Response (200):**
```json
{
  "success": true,
  "data": [ /* array of Person */ ]
}
```

### GET /api/persons/:id
**Success Response (200):** `{ "success": true, "data": { /* Person */ } }`

**Error Responses:**
- **404**: `{ "success": false, "error": "Person not found" }`

### POST /api/persons
**Request Body:**
```json
{
  "name": "string",
  "type": "CLIENT | SUPPLIER",
  "documentType": "CPF | CNPJ",
  "document": "string",
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

**Success Response (201):** `{ "success": true, "data": { "message": "Person created successfully" } }`

**Error Responses (400):** first validation issue found, e.g. `"Name is required"`, `"Document is required"`, `"Invalid document format"` (CPF must have 11 digits, CNPJ 14), `"Invalid email"`.

> Person validation did not exist in the legacy Express API (only the frontend validated it). It was added during the Fastify migration as a single Zod schema shared with the frontend (`packages/schemas`) — see `docs/index.md`.

### PUT /api/persons/:id
Same body and validation as `POST /api/persons`.

**Success Response (200):** `{ "success": true, "data": { "message": "Person updated successfully" } }`

### DELETE /api/persons/:id
**Success Response (200):** `{ "success": true, "data": { "message": "Person deleted successfully" } }`

## Validation mechanism

Request validation is implemented with [Zod](https://zod.dev) schemas from `packages/schemas`, shared between `apps/api` (Fastify) and `apps/web` (Next.js) so client and server never validate differently:

- `/api/auth/*`: field checks and messages are hand-written in the controller to guarantee an exact, stable match with the messages documented above.
- `/api/persons/*`: validated by `personCreateSchema`/`personUpdateSchema`; the response `error` is the first Zod issue message.

This replaces the legacy manual `if (!field)` checks — the response envelope, status codes and auth messages are unchanged.

## CORS

`apps/api` explicitly allows `GET, HEAD, POST, PUT, DELETE, OPTIONS` (`apps/api/src/app.ts`). `@fastify/cors`'s own default only allows `GET`/`HEAD`/`POST` — the person endpoints' `PUT`/`DELETE` calls were silently blocked by the browser's preflight check until this was set explicitly. This only surfaces with a real browser `fetch` (curl and Playwright's API request context don't enforce CORS), which is why it wasn't caught until `apps/web`'s Person edit/delete flows were tested end-to-end in a browser.

## Notes
- All error messages should be clear and actionable for users
- Frontend applications can rely on `success` boolean to handle responses
- Status codes provide additional context for programmatic handling
- This standardization ensures consistent behavior across all API endpoints