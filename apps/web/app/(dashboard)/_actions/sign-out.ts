'use server';

import { redirect } from 'next/navigation';
import { destroySession } from '@/lib/session';

/**
 * Signing out now actually ends the session — it used to be a `router.push`
 * that left everything in place.
 */
export async function signOutAction(): Promise<void> {
  await destroySession();
  redirect('/login');
}
