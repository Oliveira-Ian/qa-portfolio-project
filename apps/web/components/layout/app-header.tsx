'use client';

import Link from 'next/link';
import { Wordmark } from '@/components/brand/wordmark';
import type { RoutinePath } from '@/lib/navigation/catalog';
import { GlobalSearch } from './global-search';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';

interface AppHeaderProps {
  userName: string;
  userEmail: string;
  searchRoutines: RoutinePath[];
}

/**
 * The sidebar's own toggle button (`sidebar-toggle.tsx`) replaced the one
 * that used to live here — the toggle now sits at the top of the rail it
 * controls, so it's reachable from a collapsed sidebar without going through
 * the header at all.
 */
export function AppHeader({ userName, userEmail, searchRoutines }: AppHeaderProps) {
  return (
    <header
      data-testid="dashboard-header"
      className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-header-border bg-header px-3 text-header-foreground sm:px-4"
    >
      <Link
        href="/home"
        className="rounded-md px-1 py-1 text-header-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        data-testid="dashboard-header-logo"
      >
        <Wordmark tone="light" size={24} />
      </Link>

      <div className="flex flex-1 justify-center px-2">
        <GlobalSearch routines={searchRoutines} />
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <UserMenu name={userName} email={userEmail} />
      </div>
    </header>
  );
}
