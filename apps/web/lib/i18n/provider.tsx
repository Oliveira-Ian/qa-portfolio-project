'use client';

import { createContext, useContext, useMemo } from 'react';
import type { Locale } from './config';
import { createTranslator, type FlatMessages, type Translator } from './translate';

interface I18nValue {
  locale: Locale;
  t: Translator;
}

const I18nContext = createContext<I18nValue | null>(null);

interface I18nProviderProps {
  locale: Locale;
  /** The active language's catalogue only — the other one never ships to the browser. */
  messages: FlatMessages;
  children: React.ReactNode;
}

export function I18nProvider({ locale, messages, children }: I18nProviderProps) {
  const value = useMemo(
    () => ({ locale, t: createTranslator(locale, messages) }),
    [locale, messages],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function useI18n(): I18nValue {
  const value = useContext(I18nContext);

  if (!value) {
    throw new Error('useT/useLocale must be used inside <I18nProvider>');
  }

  return value;
}

/** `t()` for a Client Component. */
export function useT(): Translator {
  return useI18n().t;
}

export function useLocale(): Locale {
  return useI18n().locale;
}
