import type { FastifyRequest } from 'fastify';
import type { SessionAccount } from '@oliveira/schemas';
import { UnauthorizedError } from '../../shared/errors.js';
import { accountRepository } from '../account/account.repository.js';
import { verifySessionToken } from './token.js';

declare module 'fastify' {
  interface FastifyRequest {
    /**
     * Set by `requireAuth`; present on every protected route. Read from the
     * database on this request, not copied from the token — see `requireAuth`.
     */
    account?: SessionAccount;
  }
}

const BEARER_PREFIX = 'Bearer ';

/**
 * Route `preHandler` that rejects anything without a valid session token —
 * and that is all the token is trusted for: **who** is calling. Whether that
 * account still exists and is active, and which role it holds, are read from
 * the database on every request.
 *
 * Trusting the token for those would let a deactivated account, or an admin
 * demoted a minute ago, keep its old access until the token expired (8 hours).
 * `docs/product/access_control.md` promises that a change an admin makes takes
 * effect on the account's very next request; this is where that is true. The
 * cost is one primary-key lookup per request.
 *
 * Every failure answers the same way — a caller shouldn't be able to tell an
 * expired token from a forged one, or from a deactivated account.
 */
export async function requireAuth(request: FastifyRequest): Promise<void> {
  const header = request.headers.authorization;

  if (!header?.startsWith(BEARER_PREFIX)) {
    throw new UnauthorizedError();
  }

  let tokenAccount: SessionAccount;

  try {
    tokenAccount = await verifySessionToken(header.slice(BEARER_PREFIX.length));
  } catch {
    throw new UnauthorizedError();
  }

  // Outside the try on purpose: a database failure here is a 500, not a 401 —
  // answering "unauthorized" would sign everyone out whenever Postgres blips.
  const account = await accountRepository.findById(tokenAccount.id);

  if (!account || !account.active) {
    throw new UnauthorizedError();
  }

  request.account = {
    id: account.id,
    personId: account.personId,
    name: account.person.name,
    email: account.email,
    role: account.role,
  };
}
