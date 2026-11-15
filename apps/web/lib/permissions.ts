import 'server-only';

import { cache } from 'react';
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
 * mid-session). `apiRequest` handles that for every call, this one included: it
 * clears the cookie through `/api/session/expire` and sends the user to `/login`
 * (`lib/api/client.ts` says why it can't be a plain redirect).
 */
export const getMe = cache(async (): Promise<MeResponse> => {
  const { token } = await requireSession();

  return unwrap(await requestMe(token));
});

/** Whether the caller administers their own company — layer 2 of docs/adr/0018; it grants nothing in a product. */
export async function isCompanyAdmin(): Promise<boolean> {
  const me = await getMe();
  return me.membership?.role === 'ADMIN';
}

/**
 * Exactly what `/me` reports: the permissions the caller's profiles grant in
 * the ERP (none without an ERP seat). No role widens it — the API has no
 * administrator exemption either (docs/adr/0018), so this can't hide a button
 * the API would allow, or show one it would refuse.
 */
export async function can(permission: PermissionKey): Promise<boolean> {
  const me = await getMe();
  return me.permissions.includes(permission);
}
