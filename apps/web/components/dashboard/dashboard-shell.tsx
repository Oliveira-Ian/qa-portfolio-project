'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  testId: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Settings',
    items: [{ label: 'Users', href: '/users', testId: 'dashboard-nav-users' }],
  },
  {
    label: 'Records',
    items: [{ label: 'People', href: '/people', testId: 'dashboard-nav-people' }],
  },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userInitial, setUserInitial] = useState('U');

  useEffect(() => {
    // One-time hydration from localStorage (unavailable during SSR).
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserInitial(rememberedUser.charAt(0).toUpperCase());
    }
  }, []);

  return (
    <div className="min-h-screen">
      <header
        className="fixed inset-x-0 top-0 z-[100] flex h-14 items-center justify-between border-b border-header-border bg-header px-[var(--spacing-lg)]"
        data-testid="dashboard-header"
      >
        <div className="flex items-center gap-[var(--spacing-md)]">
          <button
            type="button"
            className="flex h-8 w-8 flex-col items-center justify-center gap-[5px]"
            aria-label="Toggle sidebar"
            data-testid="dashboard-sidebar-toggle"
            onClick={() => setSidebarOpen((value) => !value)}
          >
            <span className="block h-0.5 w-5 rounded-full bg-header-foreground-muted" />
            <span className="block h-0.5 w-5 rounded-full bg-header-foreground-muted" />
            <span className="block h-0.5 w-5 rounded-full bg-header-foreground-muted" />
          </button>
          <Link href="/home">
            <Image
              src="/images/logo-ian2.png"
              alt="Oliveira ERP"
              width={33}
              height={32}
              className="w-auto object-contain"
            />
          </Link>
        </div>

        <div data-testid="header-user-menu">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-header-foreground select-none hover:bg-primary-hover"
                data-testid="header-user-avatar"
              >
                {userInitial}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" data-testid="header-user-dropdown">
              <DropdownMenuItem data-testid="header-dropdown-about">About</DropdownMenuItem>
              <DropdownMenuItem
                data-testid="header-dropdown-signout"
                onClick={() => router.push('/login')}
              >
                SignOut
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <nav
        className={cn(
          'fixed top-14 left-0 z-[90] flex h-[calc(100vh-56px)] w-60 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-60',
        )}
        data-testid="dashboard-sidebar"
      >
        <div className="flex flex-1 flex-col gap-1 py-[var(--spacing-md)]">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="px-[var(--spacing-lg)] pt-[var(--spacing-lg)] pb-[var(--spacing-sm)] text-xs font-semibold tracking-wide text-sidebar-section uppercase">
                {section.label}
              </div>
              {section.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-testid={item.testId}
                    className={cn(
                      'mx-[var(--spacing-md)] flex items-center rounded-md px-[var(--spacing-lg)] py-[var(--spacing-md)] text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary text-header-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-header-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </nav>

      <main
        className={cn(
          'mt-14 min-h-[calc(100vh-56px)] bg-background p-[var(--spacing-xl)] transition-[margin] duration-200',
          sidebarOpen ? 'md:ml-60' : 'ml-0',
        )}
        data-testid="dashboard-main"
      >
        {children}
      </main>
    </div>
  );
}
