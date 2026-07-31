import 'server-only';

import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { sessionAccountSchema, type SessionAccount } from '@oliveira/schemas';

const SESSION_COOKIE = 'oliveira_session';

/** Matches the API's own token lifetime (`JWT_EXPIRES_IN`, 8h). */
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

/**
 * The cookie holds both the bearer token and the account the header renders.
 *
 * Storing the account alongside the token avoids a round trip to the API on
 * every single page render just to learn the display name. It is safe to
 * display but not to trust: the cookie is httpOnly and set only after the API
 * accepted the credentials, and anything that actually matters is authorised
 * by the API against the signed token, not against this copy.
 */
const sessionSchema = z.object({
  token: z.string().min(1),
  account: sessionAccountSchema,
});

export type Session = z.infer<typeof sessionSchema>;

/**
 * `cache()` dedupes this within a single render pass — a page, its layout and
 * three data-access helpers all reading the session parse the cookie once.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;

  if (!raw) {
    return null;
  }

  const parsed = sessionSchema.safeParse(safeJsonParse(raw));

  // A cookie left over from an older shape is treated as no session at all.
  return parsed.success ? parsed.data : null;
});

/**
 * Use in any Server Component or Server Action that must not run anonymously.
 * `middleware.ts` already turns most of these away, but middleware only sees
 * that a cookie exists — this is the check that reads it.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return session;
}

export async function getSessionAccount(): Promise<SessionAccount | null> {
  return (await getSession())?.account ?? null;
}

export async function createSession(session: Session): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export { SESSION_COOKIE };

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
