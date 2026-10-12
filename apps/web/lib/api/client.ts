import 'server-only';

import { redirect } from 'next/navigation';

/**
 * Where a request lands when the API stops accepting the session's token. A Server
 * Component or Server Action can `redirect()` but cannot clear a cookie, and
 * `proxy.ts` would bounce `/login` straight back to `/home` while the cookie is
 * still there — so the redirect goes through a Route Handler that clears it
 * (`app/api/session/expire/route.ts`) and then sends the user to `/login`.
 */
const SESSION_EXPIRE_PATH = '/api/session/expire';

/**
 * Transport layer for `apps/api`.
 *
 * Every call now happens on the Next server, never in the browser: the session
 * token lives in an httpOnly cookie that client JavaScript cannot read, so the
 * browser has nothing to authenticate with even if it wanted to. That also means
 * the API's address is a server-side secret rather than a `NEXT_PUBLIC_` value
 * baked into the bundle.
 */
const DEFAULT_API_URL = 'http://localhost:3001';

/**
 * `API_URL` is what the Next *server* dials, which is not the same address the
 * browser used to: inside Docker Compose the API answers at `http://api:3000`,
 * while `localhost:3001` only exists on the host.
 */
export const apiBaseUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: string;
  status: number;
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | undefined;
  query?: Record<string, string | undefined>;
}

/** Thrown by `unwrap` so a failing page render lands in `error.tsx`. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const NETWORK_ERROR = 'Could not reach the server. Check that the API is running and try again.';
const MALFORMED_ERROR = 'The server sent a response this app could not read.';

function buildUrl(path: string, query: RequestOptions['query']): string {
  const url = new URL(path, apiBaseUrl);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

/** Narrows the parsed body to the documented `{ success, … }` envelope. */
function readEnvelope<T>(payload: unknown, status: number): ApiResult<T> {
  if (typeof payload !== 'object' || payload === null || !('success' in payload)) {
    return { success: false, error: MALFORMED_ERROR, status };
  }

  const envelope = payload as { success: unknown; data?: unknown; error?: unknown };

  if (envelope.success === true) {
    return { success: true, data: envelope.data as T };
  }

  return {
    success: false,
    error: typeof envelope.error === 'string' ? envelope.error : MALFORMED_ERROR,
    status,
  };
}

/**
 * Never throws on a failed request — callers get a result they can render.
 * Server Actions need the API's message to put back on the form, and an
 * exception would take the whole page down instead.
 *
 * The one exception is a `401` to a request that *sent a token*: the session is
 * over (the token expired past `JWT_EXPIRES_IN`, or the account was deactivated),
 * and there is no message worth rendering — a form left open past that point used
 * to answer "Unauthorized" in a toast and leave the user stuck there. It redirects
 * to `SESSION_EXPIRE_PATH` instead, from a page render and from a Server Action
 * alike. A `401` without a token (a wrong password at sign-in) is still a result.
 */
export async function apiRequest<T>(
  path: string,
  { method = 'GET', body, token, query }: RequestOptions = {},
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      // Session-scoped data is never cacheable across users.
      cache: 'no-store',
    });
  } catch {
    return { success: false, error: NETWORK_ERROR, status: 0 };
  }

  if (response.status === 401 && token) {
    redirect(SESSION_EXPIRE_PATH);
  }

  try {
    return readEnvelope<T>(await response.json(), response.status);
  } catch {
    return { success: false, error: MALFORMED_ERROR, status: response.status };
  }
}

/** For read paths where a failure genuinely is an exceptional condition. */
export function unwrap<T>(result: ApiResult<T>): T {
  if (!result.success) {
    throw new ApiError(result.error, result.status);
  }

  return result.data;
}
