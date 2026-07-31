'use client';

import { useMemo } from 'react';
import type { PermissionKey } from '@oliveira/schemas';
import { cn } from '@/lib/utils';
import { filterCatalogForAccount, flattenRoutines } from '@/lib/navigation/catalog';
import { useSidebarMode } from '@/lib/navigation/sidebar-preference';
import { AppHeader } from './app-header';
import { AppSidebar } from './app-sidebar';
import { BreadcrumbTrail } from './breadcrumb-trail';

interface DashboardShellProps {
  userName: string;
  userEmail: string;
  isAdmin: boolean;
  permissions: readonly PermissionKey[];
  children: React.ReactNode;
}

/**
 * Owns the sidebar's expanded/compact mode — the one piece of layout state
 * that both the sidebar itself (to render at the right width) and `main`
 * (to pad around it) need to agree on. Everything else the shell renders is
 * composed from `app-header` / `app-sidebar` / `breadcrumb-trail`.
 *
 * The sidebar never fully hides, on any viewport — it's always at least the
 * compact icon rail, which is what keeps its own toggle button reachable.
 * On mobile, "expanded" is a modal-like overlay (a `md:hidden` backdrop
 * covers the content behind it); on desktop it pushes `main` over instead.
 *
 * `filterCatalogForAccount()`/`flattenRoutines()` run here, client-side, not
 * in the server layout — `ModuleDefinition.icon` is a component reference,
 * and functions can't cross the Server→Client props boundary.
 */
export function DashboardShell({
  userName,
  userEmail,
  isAdmin,
  permissions,
  children,
}: DashboardShellProps) {
  const { mode, toggle, setMode } = useSidebarMode();
  const navigationModules = useMemo(
    () => filterCatalogForAccount({ isAdmin, permissions }),
    [isAdmin, permissions],
  );
  const searchRoutines = useMemo(() => flattenRoutines(navigationModules), [navigationModules]);

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader userName={userName} userEmail={userEmail} searchRoutines={searchRoutines} />

      <AppSidebar
        mode={mode}
        onToggle={toggle}
        onCollapse={() => setMode('compact')}
        onExpand={() => setMode('expanded')}
        modules={navigationModules}
      />

      {mode === 'expanded' ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 top-14 z-20 bg-foreground/40 md:hidden"
          onClick={() => setMode('compact')}
        />
      ) : null}

      <main
        data-testid="dashboard-main"
        className={cn(
          'pl-16 transition-[padding] duration-200 ease-out',
          mode === 'expanded' ? 'md:pl-60' : 'md:pl-16',
        )}
      >
        <div className="px-4 pt-14 sm:px-6">
          <div className="mx-auto w-full max-w-6xl py-8">
            <BreadcrumbTrail />
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
