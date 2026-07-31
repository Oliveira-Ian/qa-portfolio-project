'use server';

import { redirect } from 'next/navigation';
import { authMessages, loginFormSchema, type LoginFormValues } from '@oliveira/schemas';
import { requestLogin } from '@/lib/api/auth';
import type { ActionResult } from '@/lib/actions';
import { createSession } from '@/lib/session';

/**
 * Credentials never touch the browser's JavaScript: the form posts here, the
 * server talks to the API, and the resulting token goes straight into an
 * httpOnly cookie. Nothing readable by a script ever holds it.
 *
 * The client already validated with the same schema — this re-validates because
 * a Server Action is a public endpoint, and a caller can skip the form.
 *
 * Only ever returns on failure — success redirects, and `redirect()` throws
 * internally, so nothing after it runs.
 */
export async function loginAction(values: LoginFormValues, next?: string): Promise<ActionResult> {
  const parsed = loginFormSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, message: authMessages.login.missingFields };
  }

  const result = await requestLogin(parsed.data);

  if (!result.success) {
    return { success: false, message: result.error };
  }

  await createSession({ token: result.data.token, account: result.data.user });

  // Only same-origin paths, or a crafted `?next=https://evil.example` would
  // turn the sign-in form into an open redirect.
  redirect(next?.startsWith('/') ? next : '/home');
}
