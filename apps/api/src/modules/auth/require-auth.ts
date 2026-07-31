import type { FastifyRequest } from 'fastify';
import type { SessionAccount } from '@oliveira/schemas';
import { UnauthorizedError } from '../../shared/errors.js';
import { verifySessionToken } from './token.js';

declare module 'fastify' {
  interface FastifyRequest {
    /** Set by `requireAuth`; present on every protected route. */
    account?: SessionAccount;
  }
}

const BEARER_PREFIX = 'Bearer ';

/**
 * Route `preHandler` that rejects anything without a valid session token.
 *
 * Every failure answers the same way — a caller shouldn't be able to tell an
 * expired token from a forged one.
 */
export async function requireAuth(request: FastifyRequest): Promise<void> {
  const header = request.headers.authorization;

  if (!header?.startsWith(BEARER_PREFIX)) {
    throw new UnauthorizedError();
  }

  try {
    request.account = await verifySessionToken(header.slice(BEARER_PREFIX.length));
  } catch {
    throw new UnauthorizedError();
  }
}
