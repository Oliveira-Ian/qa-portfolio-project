'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, Check, Lock, Menu, UserRound, X } from 'lucide-react';
import { PRODUCTS, type Product } from '@oliveira/schemas';
import { BrandMark, Wordmark } from '@/components/brand/wordmark';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useT } from '@/lib/i18n/provider';
import { AREA_HOME, type AreaKey, type NavSection } from '@/lib/navigation/nav';
import { PRODUCT_AVAILABILITY, areaScope, areaShortName } from '@/lib/products';
import { cn } from '@/lib/utils';
import { LanguageSwitch } from './language-switch';
import { ShellNav } from './sidebar';

interface MobileDrawerProps {
  area: AreaKey;
  products: readonly Product[];
  sections: readonly NavSection[];
  companyName: string | null;
  userName: string;
  userEmail: string;
}

/**
 * Below 1024px the sidebar is a drawer, and below 768px it holds everything the
 * bar can't fit (handoff § 6): the company, the products with their access
 * state, the product's navigation and the language. 320px wide, focus-trapped,
 * closed by Esc, the scrim or choosing a destination.
 */
export function MobileDrawer({
  area,
  products,
  sections,
  companyName,
  userName,
  userEmail,
}: MobileDrawerProps) {
  const t = useT();
  const [open, setOpen] = useState(false);

  const productRows = [
    { area: 'platform' as AreaKey, state: area === 'platform' ? 'current' : 'access' },
    ...PRODUCTS.map((product) => ({
      area: product as AreaKey,
      state: !PRODUCT_AVAILABILITY[product].available
        ? 'soon'
        : area === product
          ? 'current'
          : products.includes(product)
            ? 'access'
            : 'noAccess',
    })),
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          data-testid="shell-menu-button"
          aria-label={t('shell.drawer.open')}
          className="grid size-10 place-items-center rounded-md text-shell-text outline-none hover:bg-shell-control hover:text-white focus-visible:ring-focus-shell lg:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
      </SheetTrigger>

      <SheetContent
        side="left"
        showCloseButton={false}
        data-shell
        data-testid="shell-drawer"
        className="w-80 max-w-[86vw] gap-0 border-r border-shell-border bg-shell p-0 text-shell-text data-[side=left]:w-80 data-[side=left]:sm:max-w-80"
      >
        <SheetTitle className="sr-only">{t('shell.drawer.title')}</SheetTitle>
        <SheetDescription className="sr-only">{t('shell.drawer.description')}</SheetDescription>

        <div className="flex h-14 shrink-0 items-center justify-between border-b border-shell-border px-4">
          <span data-product={areaScope(area)}>
            <Wordmark product={areaShortName(area)} size={26} divider />
          </span>
          <button
            type="button"
            aria-label={t('shell.drawer.close')}
            onClick={() => setOpen(false)}
            className="grid size-9 place-items-center rounded-md text-shell-text outline-none hover:bg-shell-control hover:text-white focus-visible:ring-focus-shell"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          {companyName ? (
            <div className="mb-5 flex h-11 items-center gap-2.5 rounded-md border border-shell-border bg-shell-control px-3 text-sm text-white">
              <Building2 className="size-4 shrink-0 text-shell-text-muted" aria-hidden="true" />
              <span className="truncate">{companyName}</span>
            </div>
          ) : null}

          <p className="olv-overline px-3 pb-1.5 text-shell-text-muted">
            {t('shell.products.heading')}
          </p>
          <ul className="mb-5 flex flex-col gap-0.5">
            {productRows.map((row) => {
              const isSoon = row.state === 'soon';
              const isCurrent = row.state === 'current';
              const inner = (
                <>
                  <BrandMark tone="dark" height={24} />
                  <span className="min-w-0 flex-1 truncate font-medium text-white" translate="no">
                    Oliveira{' '}
                    <span data-product={areaScope(row.area)} className="text-accent-300">
                      {areaShortName(row.area)}
                    </span>
                  </span>
                  {isCurrent ? (
                    <Check
                      className="size-4 text-accent-300"
                      aria-label={t('shell.products.current')}
                    />
                  ) : (
                    <span className="olv-overline inline-flex items-center gap-1 text-shell-text-muted">
                      {row.state === 'noAccess' ? (
                        <Lock className="size-3" aria-hidden="true" />
                      ) : null}
                      {t(
                        row.state === 'access'
                          ? 'shell.products.access'
                          : row.state === 'noAccess'
                            ? 'shell.products.noAccess'
                            : 'shell.products.soon',
                      )}
                    </span>
                  )}
                </>
              );
              const rowClass = cn(
                'flex h-11 items-center gap-3 rounded-md px-3 text-sm outline-none',
                isCurrent && 'bg-shell-active',
                isSoon
                  ? 'cursor-not-allowed opacity-80'
                  : 'hover:bg-shell-control focus-visible:ring-focus-shell',
              );

              return (
                <li key={row.area}>
                  {isSoon ? (
                    <div className={rowClass} aria-disabled="true">
                      {inner}
                    </div>
                  ) : (
                    <Link
                      href={AREA_HOME[row.area]}
                      className={rowClass}
                      aria-current={isCurrent ? 'page' : undefined}
                      onClick={() => setOpen(false)}
                    >
                      {inner}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>

          <ShellNav sections={sections} variant="drawer" onNavigate={() => setOpen(false)} />
        </div>

        <div className="flex shrink-0 items-center gap-3 border-t border-shell-border px-4 py-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--olv-gold-300)] text-[var(--olv-navy-700)]">
            <UserRound className="size-[18px]" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-white">{userName}</span>
            <span className="block truncate text-xs text-shell-text-muted">{userEmail}</span>
          </span>
          <LanguageSwitch tone="dark" labels="short" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
