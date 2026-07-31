'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** The static description of a destination, without any behaviour. */
export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  testId: string;
}

export interface NavItemProps extends NavLink {
  onNavigate: () => void;
}

/**
 * A real `<Link>`, not a click handler on a div — middle-click and
 * cmd-click have to open a new tab like any other link in the product.
 *
 * The active state carries `aria-current="page"` for assistive tech *and* a
 * visible olive fill; the rule at the leading edge is what the eye actually
 * tracks down the column.
 */
export function NavItem({ href, label, icon: Icon, testId, onNavigate }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      data-testid={testId}
      aria-current={isActive ? 'page' : undefined}
      onClick={onNavigate}
      className={cn(
        'group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        isActive
          ? 'bg-primary/15 font-medium text-sidebar-accent-foreground'
          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full transition-opacity',
          isActive ? 'bg-primary opacity-100' : 'opacity-0',
        )}
      />
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </Link>
  );
}
