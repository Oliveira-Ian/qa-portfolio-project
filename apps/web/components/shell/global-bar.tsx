'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, Search, X } from 'lucide-react';
import type { Product } from '@oliveira/schemas';
import { BrandMark } from '@/components/brand/wordmark';
import { useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import type { AreaKey, NavSection, SearchEntry } from '@/lib/navigation/nav';
import { AccountMenu } from './account-menu';
import { GlobalSearch } from './global-search';
import { MobileDrawer } from './mobile-drawer';
import { ProductSwitcher } from './product-switcher';

interface GlobalBarProps {
  area: AreaKey;
  products: readonly Product[];
  sections: readonly NavSection[];
  searchEntries: SearchEntry[];
  companyName: string | null;
  userName: string;
  userEmail: string;
}

/**
 * The global bar (handoff § 5): Platform-owned and identical in every product.
 * 52px (56 on mobile): the compact crest and "Oliveira", the product switcher,
 * global search (Ctrl+Shift+F), the company, and the account menu — where the
 * language lives.
 *
 * The company is shown, not switched: a user belongs to one company until
 * company switching exists (docs/adr/0018), so there is nothing to pick from.
 *
 * Responsive: from 1024px the search is a field; below it, an icon that opens the
 * field over the bar. Below 768px the company moves into the drawer.
 */
export function GlobalBar({
  area,
  products,
  sections,
  searchEntries,
  companyName,
  userName,
  userEmail,
}: GlobalBarProps) {
  const t = useT();
  const [isSearching, setIsSearching] = useState(false);

  return (
    <header
      data-shell
      data-testid="dashboard-header"
      className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-2 border-b border-shell-border bg-shell px-3 text-shell-text md:h-[52px] md:gap-3 md:px-4"
    >
      {isSearching ? (
        <div className="flex w-full items-center gap-2 lg:hidden">
          <GlobalSearch entries={searchEntries} className="max-w-none" />
          <button
            type="button"
            aria-label={t('shell.search.close')}
            onClick={() => setIsSearching(false)}
            className="grid size-10 shrink-0 place-items-center rounded-md text-shell-text outline-none hover:bg-shell-control hover:text-white focus-visible:ring-focus-shell"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <div
        className={
          isSearching
            ? 'hidden w-full items-center gap-2 lg:flex'
            : 'flex w-full items-center gap-2 md:gap-3'
        }
      >
        <MobileDrawer
          area={area}
          products={products}
          sections={sections}
          companyName={companyName}
          userName={userName}
          userEmail={userEmail}
        />

        <Link
          href={ROUTES.home}
          data-testid="dashboard-header-logo"
          className="inline-flex items-center gap-2.5 rounded-md py-1 pr-1 outline-none focus-visible:ring-focus-shell"
        >
          <BrandMark tone="dark" height={28} />
          <span
            translate="no"
            className="hidden font-display text-base leading-none font-semibold tracking-[-0.01em] text-white sm:inline"
          >
            Oliveira
          </span>
          <span className="sr-only sm:hidden" translate="no">
            Oliveira
          </span>
        </Link>

        <ProductSwitcher area={area} products={products} />

        <div className="hidden min-w-0 flex-1 justify-center px-2 lg:flex">
          <GlobalSearch entries={searchEntries} />
        </div>
        <div className="flex-1 lg:hidden" />

        <button
          type="button"
          data-testid="global-search-open"
          aria-label={t('shell.search.open')}
          onClick={() => setIsSearching(true)}
          className="grid size-10 place-items-center rounded-md text-shell-text outline-none hover:bg-shell-control hover:text-white focus-visible:ring-focus-shell lg:hidden"
        >
          <Search className="size-5" aria-hidden="true" />
        </button>

        {companyName ? (
          <span
            data-testid="header-company"
            title={companyName}
            className="hidden h-8 max-w-56 items-center gap-2 rounded-md border border-shell-border bg-shell-control px-3 text-sm text-white md:inline-flex"
          >
            <Building2 className="size-4 shrink-0 text-shell-text-muted" aria-hidden="true" />
            <span className="truncate">{companyName}</span>
          </span>
        ) : null}

        <AccountMenu name={userName} email={userEmail} />
      </div>
    </header>
  );
}
