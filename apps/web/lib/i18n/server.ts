import 'server-only';

import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  pickLocaleFromAcceptLanguage,
  type Locale,
} from './config';
import { getMessages } from './messages';
import { createTranslator, type Translator } from './translate';

/**
 * The UI language for this request: the saved choice, else the browser's
 * preferred language on a first visit, else English. `cache()` makes every
 * Server Component of one render agree on it without re-reading the cookie.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;

  if (isLocale(saved)) {
    return saved;
  }

  try {
    return pickLocaleFromAcceptLanguage((await headers()).get('accept-language'));
  } catch {
    return DEFAULT_LOCALE;
  }
});

/** `t()` for a Server Component or a Server Action. */
export const getTranslator = cache(async (): Promise<Translator> => {
  const locale = await getLocale();

  return createTranslator(locale, getMessages(locale));
});
