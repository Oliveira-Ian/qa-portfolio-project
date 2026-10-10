'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setLocaleAction } from '@/app/_actions/set-locale';
import { LOCALES, LOCALE_NAMES, LOCALE_SHORT_NAMES, type Locale } from '@/lib/i18n/config';
import { useLocale, useT } from '@/lib/i18n/provider';
import { cn } from '@/lib/utils';

interface LanguageSwitchProps {
  /** `dark` on the shell (account menu, mobile drawer), `light` on the auth screens. */
  tone?: 'light' | 'dark';
  /** `short` shows EN / PT, where space is tight; `long` shows English / Português. */
  labels?: 'short' | 'long';
  /** Prefix of the `data-testid`s; a second switch on the same page needs its own. */
  testId?: string;
  className?: string;
}

/**
 * The segmented control that switches the interface language (handoff § 4,
 * § 7): on the auth screens and in the account menu / mobile drawer. Buttons
 * with `aria-pressed`, not a menu — there are two choices and both stay visible.
 *
 * It saves the choice (a cookie, see `set-locale.ts`) and refreshes the server
 * tree so every Server Component re-renders in the new language without a
 * navigation.
 */
export function LanguageSwitch({
  tone = 'light',
  labels = 'long',
  testId = 'language-switch',
  className,
}: LanguageSwitchProps) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSelect(next: Locale) {
    if (next === locale) {
      return;
    }

    startTransition(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label={t('common.language')}
      data-testid={testId}
      className={cn(
        'inline-flex gap-0.5 rounded-lg p-[3px]',
        tone === 'dark' ? 'bg-shell-control' : 'bg-[#e9e6df]',
        isPending && 'opacity-70',
        className,
      )}
    >
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          lang={option}
          aria-pressed={option === locale}
          aria-label={LOCALE_NAMES[option]}
          data-testid={`${testId}-${option}`}
          onClick={() => handleSelect(option)}
          className={cn(
            'h-7 rounded-md px-3 text-[13px] font-medium transition-colors duration-100 outline-none focus-visible:ring-2',
            tone === 'dark'
              ? 'text-shell-text-muted hover:text-white focus-visible:ring-shell-focus aria-pressed:bg-[#343a46] aria-pressed:text-white'
              : 'text-text-3 hover:text-foreground focus-visible:ring-ring aria-pressed:bg-white aria-pressed:text-foreground aria-pressed:shadow-[0_1px_2px_rgba(18,21,27,.12),0_0_0_1px_rgba(18,21,27,.04)]',
          )}
        >
          {labels === 'short' ? LOCALE_SHORT_NAMES[option] : LOCALE_NAMES[option]}
        </button>
      ))}
    </div>
  );
}
