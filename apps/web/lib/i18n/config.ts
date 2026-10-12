/**
 * The interface languages (design handoff § 7, board 05). English is the
 * default and the fallback; Brazilian Portuguese is the alternative. One
 * interface, two catalogues — no separate layouts.
 *
 * Product and brand names (Oliveira Platform, Oliveira ERP, Oliveira FSM) are
 * proper nouns: they live in `@oliveira/schemas`'s `PRODUCT_LABELS` and never
 * in a catalogue.
 */
export const LOCALES = ['en', 'pt-BR'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** A plain cookie: the language is a preference of the browser, not a secret. */
export const LOCALE_COOKIE = 'oliveira_locale';

export const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** Each language is named in itself, so a reader can always find theirs. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  'pt-BR': 'Português',
};

/** What the compact segmented control shows (account menu, mobile drawer). */
export const LOCALE_SHORT_NAMES: Record<Locale, string> = {
  en: 'EN',
  'pt-BR': 'PT',
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * First visit: the browser's preferred language, English when it is neither.
 * Any Portuguese (`pt`, `pt-PT`, `pt-BR`) maps to the one Portuguese catalogue.
 */
export function pickLocaleFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) {
    return DEFAULT_LOCALE;
  }

  const preferred = header
    .split(',')
    .map((part) => {
      const [tag = '', quality] = part.trim().split(';q=');
      return { tag: tag.toLowerCase(), quality: quality ? Number(quality) : 1 };
    })
    .filter((entry) => entry.tag && Number.isFinite(entry.quality))
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of preferred) {
    if (tag === 'pt' || tag.startsWith('pt-')) {
      return 'pt-BR';
    }

    if (tag === 'en' || tag.startsWith('en-')) {
      return 'en';
    }
  }

  return DEFAULT_LOCALE;
}
