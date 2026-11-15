'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Product, ProductPermissions } from '@oliveira/schemas';
import { useT } from '@/lib/i18n/provider';
import { buildNavigation, buildSearchEntries, type AreaKey } from '@/lib/navigation/nav';
import { saveSidebarMode, type SidebarMode } from '@/lib/navigation/sidebar-preference';
import { areaScope } from '@/lib/products';
import { Breadcrumbs } from './breadcrumbs';
import { GlobalBar } from './global-bar';
import { cn } from '@/lib/utils';
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
  /** The caller's permissions per product — they decide which screens each product's sidebar lists. */
  permissions: ProductPermissions;
  /** The guard states (no access to a product) show the global bar only, with no product sidebar. */
  hideNavigation?: boolean;
  /** The saved sidebar preference (cookie), read on the server so the first paint has the right width. */
  sidebarMode?: SidebarMode;
  children: React.ReactNode;
}

/** Main padding per sidebar mode — literal strings so Tailwind generates them. */
const MAIN_PADDING: Record<SidebarMode, string> = {
  auto: 'lg:pl-16 xl:pl-62',
  expanded: 'lg:pl-62',
  collapsed: 'lg:pl-16',
};

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

/**
 * One shell for every area (docs/adr/0019): the Platform-owned global bar, the
 * area's sidebar (the same F01 structure in every product, with its own
 * modules), and the page. `data-product` scopes the accent tokens to
 * the area (`oliveira-tokens.css`) — navy for the Platform, olive for the ERP,
 * terracotta for the FSM — and that is the only per-product difference.
 *
 * Only serializable data crosses into this client component. The navigation
 * itself is built here, because a navigation item's icon is a component
 * reference and functions cannot cross the Server→Client boundary.
 *
 * Layout by width (board F01): from 1280px the sidebar is 248px wide, from 1024px
 * a 64px rail — unless the person chose otherwise with "Collapse/Expand menu"
 * (Ctrl+B), which then holds from 1024px. The page moves with it; nothing is
 * covered. Below 1024px there is no sidebar, only the drawer.
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
  sidebarMode = 'auto',
  children,
}: AppShellProps) {
  const t = useT();
  const [mode, setMode] = useState<SidebarMode>(sidebarMode);

  const toggleMode = useCallback(() => {
    setMode((current) => {
      const isExpandedNow =
        current === 'expanded' ||
        (current === 'auto' && window.matchMedia('(min-width: 1280px)').matches);
      const next = isExpandedNow ? 'collapsed' : 'expanded';
      saveSidebarMode(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey &&
        !event.altKey &&
        event.key.toLowerCase() === 'b' &&
        !isTypingTarget(event.target) &&
        window.matchMedia('(min-width: 1024px)').matches
      ) {
        event.preventDefault();
        toggleMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMode]);
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

      {hasSidebar ? (
        <Sidebar area={area} sections={sections} mode={mode} onToggleMode={toggleMode} />
      ) : null}

      <main
        id="main-content"
        data-testid="dashboard-main"
        className={cn(
          'pt-14 transition-[padding] duration-150 motion-reduce:transition-none md:pt-[52px]',
          hasSidebar && MAIN_PADDING[mode],
        )}
      >
        <div className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 md:py-8 xl:px-12">
          <Breadcrumbs area={area} />
          {children}
        </div>
      </main>
    </div>
  );
}
