'use client';

import { useMemo } from 'react';
import type { PermissionKey, Product } from '@oliveira/schemas';
import { useT } from '@/lib/i18n/provider';
import { buildNavigation, buildSearchEntries, type AreaKey } from '@/lib/navigation/nav';
import { areaScope } from '@/lib/products';
import { Breadcrumbs } from './breadcrumbs';
import { GlobalBar } from './global-bar';
import { Sidebar } from './sidebar';

interface AppShellProps {
  /** The area being rendered: the Platform itself, or one of the products. */
  area: AreaKey;
  userName: string;
  userEmail: string;
  /** The caller's company, or `null` for an account that has none yet. */
  companyName: string | null;
  isCompanyAdmin: boolean;
  /** The products the caller may open. */
  products: readonly Product[];
  /** The caller's ERP permissions — they decide which ERP screens the sidebar lists. */
  permissions: readonly PermissionKey[];
  /** The guard states (no access to a product) show the global bar only, with no product sidebar. */
  hideNavigation?: boolean;
  children: React.ReactNode;
}

/**
 * One shell for every area (docs/adr/0019): the Platform-owned global bar, the
 * area-owned sidebar, and the page. `data-product` scopes the accent tokens to
 * the area (`oliveira-tokens.css`) — navy for the Platform, olive for the ERP,
 * terracotta for the FSM — and that is the only per-product difference.
 *
 * Only serializable data crosses into this client component. The navigation
 * itself is built here, because a navigation item's icon is a component
 * reference and functions cannot cross the Server→Client boundary.
 *
 * Layout by width (handoff § 6): from 1280px the sidebar is 232px wide; from
 * 1024px a 64px icon rail; below that there is no sidebar, only the drawer.
 */
export function AppShell({
  area,
  userName,
  userEmail,
  companyName,
  isCompanyAdmin,
  products,
  permissions,
  hideNavigation = false,
  children,
}: AppShellProps) {
  const t = useT();
  const sections = useMemo(
    () => (hideNavigation ? [] : buildNavigation(area, { permissions, isCompanyAdmin })),
    [area, permissions, isCompanyAdmin, hideNavigation],
  );
  const searchEntries = useMemo(() => buildSearchEntries(sections), [sections]);
  const hasSidebar = sections.length > 0;

  return (
    <div data-product={areaScope(area)} className="min-h-dvh bg-background">
      <a
        href="#main-content"
        className="sr-only rounded-md bg-white px-3 py-2 text-sm font-medium text-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus-visible:ring-focus"
      >
        {t('common.skipToContent')}
      </a>

      <GlobalBar
        area={area}
        products={products}
        sections={sections}
        searchEntries={searchEntries}
        companyName={companyName}
        userName={userName}
        userEmail={userEmail}
      />

      {hasSidebar ? <Sidebar sections={sections} /> : null}

      <main
        id="main-content"
        data-testid="dashboard-main"
        className={hasSidebar ? 'pt-14 md:pt-[52px] lg:pl-16 xl:pl-58' : 'pt-14 md:pt-[52px]'}
      >
        <div className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 md:py-8 xl:px-12">
          <Breadcrumbs area={area} />
          {children}
        </div>
      </main>
    </div>
  );
}
