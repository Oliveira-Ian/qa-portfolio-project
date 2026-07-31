import { SignJWT, jwtVerify } from 'jose';
import { sessionAccountSchema, type SessionAccount } from '@oliveira/schemas';
import { env } from '../../config/env.js';

const secret = new TextEncoder().encode(env.JWT_SECRET);
const ALGORITHM = 'HS256';

export function signSessionToken(account: SessionAccount): Promise<string> {
  return new SignJWT({ ...account })
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(String(account.id))
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secret);
}

/**
 * Throws on an expired, tampered or malformed token — callers turn that into a
 * 401. The payload is re-validated with the shared schema instead of trusted:
 * a token signed by an older version of this service could be missing fields.
 */
export async function verifySessionToken(token: string): Promise<SessionAccount> {
  const { payload } = await jwtVerify(token, secret, { algorithms: [ALGORITHM] });
  return sessionAccountSchema.parse(payload);
}
