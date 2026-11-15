'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useT } from '@/lib/i18n/provider';
import type { NavItem, NavSection } from '@/lib/navigation/nav';
import { cn } from '@/lib/utils';

function isActive(pathname: string, item: NavItem): boolean {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

interface ShellNavProps {
  sections: readonly NavSection[];
  /** `rail` hides labels and overlines below the `xl` breakpoint (1024–1279px); `drawer` always shows them. */
  variant: 'rail' | 'drawer';
  onNavigate?: () => void;
}

/**
 * The product-owned navigation (handoff § 5): mono overlines, 38px items; the
 * active one takes the shell-active fill, a 3px accent marker, the accent on its
 * icon and `aria-current="page"`. Real links, so middle-click opens a tab.
 *
 * In the 64px rail (1024–1279) the labels move into tooltips (200ms delay, and
 * immediately on keyboard focus); in the drawer everything is written out.
 */
export function ShellNav({ sections, variant, onNavigate }: ShellNavProps) {
  const t = useT();
  const pathname = usePathname();
  const isRail = variant === 'rail';

  return (
    <TooltipProvider delayDuration={200}>
      <nav aria-label={t('shell.nav.label')} className="flex flex-col gap-1">
        {sections.map((section, index) => (
          <div key={section.id} className={cn('flex flex-col gap-0.5', index > 0 && 'mt-3')}>
            {section.labelKey ? (
              <>
                <p
                  className={cn(
                    'olv-overline px-3 pb-1.5 text-shell-text-muted',
                    isRail && 'hidden xl:block',
                  )}
                >
                  {t(section.labelKey)}
                </p>
                {isRail ? (
                  <span aria-hidden="true" className="mx-3 mb-1 h-px bg-shell-border xl:hidden" />
                ) : null}
              </>
            ) : null}

            {section.items.map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;
              const label = t(item.labelKey);

              const link = (
                <Link
                  href={item.href}
                  data-testid={item.testId}
                  aria-current={active ? 'page' : undefined}
                  aria-label={isRail ? label : undefined}
                  {...(onNavigate ? { onClick: onNavigate } : {})}
                  className={cn(
                    'group relative flex h-[38px] items-center gap-3 rounded-md px-3 text-sm text-shell-text transition-colors duration-100 outline-none hover:bg-shell-control hover:text-white focus-visible:ring-focus-shell',
                    active && 'bg-shell-active text-white hover:bg-shell-active',
                    isRail && 'justify-center xl:justify-start',
                  )}
                >
                  {active ? (
                    <span
                      aria-hidden="true"
                      className="absolute top-2 bottom-2 left-0 w-[3px] rounded-r-full bg-accent-300"
                    />
                  ) : null}
                  <Icon
                    className={cn('size-[18px] shrink-0', active && 'text-accent-300')}
                    aria-hidden="true"
                  />
                  <span className={cn('truncate', isRail && 'hidden xl:inline')}>{label}</span>
                </Link>
              );

              return isRail ? (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right" className="xl:hidden">
                    {label}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <div key={item.href}>{link}</div>
              );
            })}
          </div>
        ))}
      </nav>
    </TooltipProvider>
  );
}

interface SidebarProps {
  sections: readonly NavSection[];
}

/** 232px from 1280px, a 64px icon rail from 1024px, and absent below — there the drawer takes over. */
export function Sidebar({ sections }: SidebarProps) {
  if (sections.length === 0) {
    return null;
  }

  return (
    <aside
      data-shell
      data-testid="dashboard-sidebar"
      className="fixed top-[52px] bottom-0 left-0 z-30 hidden w-16 flex-col overflow-y-auto border-r border-shell-border bg-shell px-2.5 py-4 lg:flex xl:w-58 xl:px-2"
    >
      <ShellNav sections={sections} variant="rail" />
    </aside>
  );
}
