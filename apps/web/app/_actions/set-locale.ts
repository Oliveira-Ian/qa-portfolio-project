'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE_SECONDS, isLocale } from '@/lib/i18n/config';

/**
 * Saves the UI language. It is a browser preference kept in a cookie — the API
 * has no per-user profile field for it (docs/adr/0018 adds none) — so it
 * follows the browser, not the account. A Server Action is a public endpoint:
 * anything but a known language is ignored rather than stored.
 */
export async function setLocaleAction(locale: string): Promise<void> {
  if (!isLocale(locale)) {
    return;
  }

  (await cookies()).set(LOCALE_COOKIE, locale, {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: LOCALE_COOKIE_MAX_AGE_SECONDS,
  });

  revalidatePath('/', 'layout');
}
