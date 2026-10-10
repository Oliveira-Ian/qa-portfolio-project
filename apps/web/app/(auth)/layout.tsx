import { LanguageSwitch } from '@/components/shell/language-switch';
import { getTranslator } from '@/lib/i18n/server';
import { AuthMobileHeader, AuthPanel } from './_components/auth-panel';

/**
 * Sign in and Create account (handoff S01, S02, M01): a dark brand panel on the
 * left (~42%), the form on the right. Below 900px the panel becomes a compact
 * dark header — the artwork is dropped rather than shrunk, and the form gets the
 * whole viewport. The language switch lives here, top right: it is the one place
 * a signed-out visitor can change it.
 *
 * There are no Privacy / Terms links in the footer because there are no such
 * pages yet; they come back with the pages.
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslator();
  const year = new Date().getFullYear();

  return (
    <div
      data-product="platform"
      className="grid min-h-dvh bg-background min-[901px]:grid-cols-[42fr_58fr]"
      data-testid="auth-layout"
    >
      <AuthPanel />

      <div className="flex min-h-dvh flex-col min-[901px]:min-h-0">
        <AuthMobileHeader>
          <LanguageSwitch tone="dark" labels="short" testId="auth-mobile-language-switch" />
        </AuthMobileHeader>

        <div className="hidden items-center justify-end gap-3 px-10 pt-7 min-[901px]:flex">
          <span className="text-[13px] text-text-3">{t('common.language')}</span>
          <LanguageSwitch />
        </div>

        <main className="flex flex-1 items-start justify-center px-4 py-8 min-[901px]:items-center min-[901px]:px-10 min-[901px]:py-10">
          {children}
        </main>

        <footer className="px-4 py-6 text-center text-[13px] text-text-3 min-[901px]:px-10 min-[901px]:text-left">
          {t('auth.copyright', { year })}
        </footer>
      </div>
    </div>
  );
}
