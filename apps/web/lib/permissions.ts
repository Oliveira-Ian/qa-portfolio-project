import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import type { MeResponse, PermissionKey } from '@oliveira/schemas';
import { requestMe } from './api/auth';
import { unwrap } from './api/client';
import { requireSession } from './session';

/**
 * Live account + person + effective permissions, fetched from `/api/auth/me`
 * rather than trusted from the session cookie — a role or profile change an
 * admin makes mid-session takes effect on the next render, not the next
 * login. `cache()` means every Server Component on the same request shares
 * one call: the layout reads it for the header, a page might read it again
 * to gate a button, and it's still exactly one fetch.
 *
 * A 401 here means the cookie is well-formed but the token itself is no
 * longer good (expired past `JWT_EXPIRES_IN`, or the account was deactivated
 * mid-session) — routed through `/api/session/expire` rather than straight to
 * `/login`, because a Server Component can redirect but can't clear the
 * cookie itself, and `proxy.ts` would otherwise see the still-present cookie
 * and bounce `/login` right back to `/home`.
 */
export const getMe = cache(async (): Promise<MeResponse> => {
  const { token } = await requireSession();
  const result = await requestMe(token);

  if (!result.success && result.status === 401) {
    redirect('/api/session/expire');
  }

  return unwrap(result);
});

export async function isAdmin(): Promise<boolean> {
  const me = await getMe();
  return me.account.role === 'ADMIN';
}

/**
 * Mirrors the bypass rule in `apps/api/src/modules/auth/authorize.ts`:
 * `/me`'s `permissions` list is exactly what the account's profiles grant,
 * not adjusted for role — an ADMIN account only "has" whatever the
 * Administrator profile lists, same as anyone else. The bypass has to be
 * re-applied here, or an ADMIN would see UI hidden that the API would
 * actually let them use.
 */
export async function can(permission: PermissionKey): Promise<boolean> {
  const me = await getMe();
  return me.account.role === 'ADMIN' || me.permissions.includes(permission);
}
