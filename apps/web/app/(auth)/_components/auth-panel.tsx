'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { PRODUCT_LABELS } from '@oliveira/schemas';
import { Wordmark } from '@/components/brand/wordmark';
import { useT } from '@/lib/i18n/provider';
import { PLATFORM_NAME } from '@/lib/products';
import { ROUTES } from '@/lib/navigation/routes';
import { cn } from '@/lib/utils';

/** What each auth screen says about the platform; the brand panel is the same shell around it. */
function useIsRegister(): boolean {
  return usePathname() === ROUTES.register;
}

/**
 * The raster artwork on its own dark ground. The JPEG's edges are a hair off the
 * panel colour, so a radial mask fades them out instead of leaving a visible box
 * (handoff § 1: the auth panel keeps the original raster).
 */
function Crest({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/oliveira-logo-original.jpg"
      alt=""
      aria-hidden="true"
      width={1408}
      height={768}
      priority
      sizes="(min-width: 901px) 42vw, 0px"
      className={cn(
        'h-auto w-full select-none [mask-image:radial-gradient(ellipse_at_center,#000_42%,transparent_72%)]',
        className,
      )}
    />
  );
}

const PRODUCT_BARS = [
  { name: PLATFORM_NAME, key: 'platform', bar: 'bg-[var(--olv-gold-300)]' },
  { name: PRODUCT_LABELS.ERP, key: 'erp', bar: 'bg-[var(--olv-olive-300)]' },
  { name: PRODUCT_LABELS.FSM, key: 'fsm', bar: 'bg-[var(--olv-terracotta-300)]' },
] as const;

/** The dark half of the auth screens (≥ 900px): crest, headline, and what the account opens. */
export function AuthPanel() {
  const t = useT();
  const isRegister = useIsRegister();

  return (
    <aside
      className="relative hidden flex-col bg-shell text-shell-text min-[901px]:flex"
      data-testid="auth-panel"
    >
      <div className="px-12 pt-12">
        <Wordmark product="Platform" divider />
      </div>

      <div className="flex flex-1 flex-col justify-center px-12 pb-6">
        <Crest className="mx-auto max-w-[34rem]" />

        <p className="olv-display mt-2 max-w-[30rem] text-white">
          {t(isRegister ? 'auth.panel.register.headline' : 'auth.panel.signIn.headline')}
        </p>

        <ul className="mt-9 border-t border-shell-border">
          {isRegister
            ? (['account', 'company', 'access'] as const).map((step, index) => (
                <li
                  key={step}
                  className="flex items-center gap-4 border-b border-shell-border py-3.5"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'grid size-8 shrink-0 place-items-center rounded-full border font-mono text-[12px]',
                      index === 0
                        ? 'border-[var(--olv-gold-300)] text-[var(--olv-gold-300)]'
                        : 'border-shell-border text-shell-text-muted',
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className={cn(index === 0 ? 'text-white' : 'text-shell-text')}>
                    <span className="block text-[15px] font-semibold">
                      {t(`auth.panel.steps.${step}.title`)}
                    </span>
                    <span className="block text-[13px] text-shell-text-muted">
                      {t(`auth.panel.steps.${step}.body`)}
                    </span>
                  </span>
                </li>
              ))
            : PRODUCT_BARS.map((product) => (
                <li
                  key={product.key}
                  className="flex items-center gap-4 border-b border-shell-border py-3.5"
                >
                  <span
                    aria-hidden="true"
                    className={cn('h-8 w-[3px] rounded-full', product.bar)}
                  />
                  <span>
                    <span className="block text-[15px] font-semibold text-white" translate="no">
                      {product.name}
                    </span>
                    <span className="block text-[13px] text-shell-text-muted">
                      {t(`auth.panel.products.${product.key}`)}
                    </span>
                  </span>
                </li>
              ))}
        </ul>
      </div>

      <p className="px-12 pb-10 text-[13px] text-shell-text-muted">{t('auth.builtAs')}</p>
    </aside>
  );
}

/** Below 900px the panel collapses into a dark header: the lockup, the language and the headline. */
export function AuthMobileHeader({ children }: { children: React.ReactNode }) {
  const t = useT();
  const isRegister = useIsRegister();

  return (
    <header className="bg-shell px-4 pt-4 pb-5 min-[901px]:hidden" data-testid="auth-mobile-header">
      <div className="flex items-center justify-between gap-3">
        <Wordmark product="Platform" divider size={26} />
        {children}
      </div>
      <p className="olv-display mt-5 text-white">
        {t(isRegister ? 'auth.panel.register.headline' : 'auth.panel.signIn.headline')}
      </p>
    </header>
  );
}
