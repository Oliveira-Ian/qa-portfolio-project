'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { GroupDefinition, ModuleDefinition } from '@/lib/navigation/catalog';
import { buildHref, resolveBreadcrumb } from '@/lib/navigation/catalog';
import type { SidebarMode } from '@/lib/navigation/sidebar-preference';
import { cn } from '@/lib/utils';
import { SidebarToggle } from './sidebar-toggle';

interface AppSidebarProps {
  mode: SidebarMode;
  onToggle: () => void;
  onCollapse: () => void;
  onExpand: () => void;
  modules: ModuleDefinition[];
}

const rowClass =
  'group relative flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none';
const rowActiveClass = 'bg-primary/15 font-medium text-sidebar-accent-foreground';

function ModuleButton({
  module,
  isActive,
  compact,
  onSelect,
}: {
  module: ModuleDefinition;
  isActive: boolean;
  compact: boolean;
  onSelect: () => void;
}) {
  const Icon = module.icon;

  return (
    <button
      type="button"
      data-testid="dashboard-nav-module"
      className={cn(rowClass, isActive && rowActiveClass)}
      onClick={onSelect}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full transition-opacity',
          isActive ? 'bg-primary opacity-100' : 'opacity-0',
        )}
      />
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {compact ? null : <span className="flex-1 truncate">{module.label}</span>}
    </button>
  );
}

/** A Group is the trigger for its own flyout — Categoria then Rotina cascade from here via `DropdownMenuSub`. */
function GroupMenu({
  moduleSlug,
  group,
  isActive,
  compact,
}: {
  moduleSlug: string;
  group: GroupDefinition;
  isActive: boolean;
  compact: boolean;
}) {
  const Icon = group.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-testid="dashboard-nav-group"
          className={cn(rowClass, isActive && rowActiveClass)}
        >
          <span
            aria-hidden="true"
            className={cn(
              'absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full transition-opacity',
              isActive ? 'bg-primary opacity-100' : 'opacity-0',
            )}
          />
          <Icon className="size-4 shrink-0" aria-hidden="true" />
          {compact ? null : (
            <>
              <span className="flex-1 truncate">{group.label}</span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent side="right" align="start" data-testid="sidebar-flyout-categories">
        {group.categories.map((category) => (
          <DropdownMenuSub key={category.slug}>
            <DropdownMenuSubTrigger data-testid="sidebar-flyout-category">
              {category.label}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent data-testid="sidebar-flyout-routines">
              {category.routines.map((routine) => {
                // Category isn't a URL segment (ADR 0007) — only module/group/routine are.
                const href = buildHref(moduleSlug, group.slug, routine.slug);
                const RoutineIcon = routine.icon;

                return (
                  <DropdownMenuItem key={routine.slug} asChild data-testid="sidebar-flyout-routine">
                    <Link href={href}>
                      <RoutineIcon aria-hidden="true" />
                      {routine.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The hierarchical rail: Modules → (click) → that module's Groups, each a
 * flyout trigger cascading Category → Routine. Never fully hides — it's
 * always at least the icon-only rail, which is what keeps its own toggle
 * reachable (see `dashboard-shell.tsx`'s doc comment for the layout side of
 * this).
 */
export function AppSidebar({ mode, onToggle, onCollapse, onExpand, modules }: AppSidebarProps) {
  const pathname = usePathname();
  const [activeModuleSlug, setActiveModuleSlug] = useState<string | null>(
    () => resolveBreadcrumb(pathname)?.module.slug ?? null,
  );
  const previousPathname = useRef(pathname);
  const compact = mode === 'compact';

  useEffect(() => {
    if (previousPathname.current === pathname) {
      return;
    }

    previousPathname.current = pathname;
    setActiveModuleSlug(resolveBreadcrumb(pathname)?.module.slug ?? null);
    onCollapse();
    // `onCollapse` is a stable setter from the parent; omitting it from deps
    // avoids re-running this on every parent render, only on real navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const activeModule = modules.find((module) => module.slug === activeModuleSlug) ?? null;

  return (
    <aside
      data-testid="dashboard-sidebar"
      className={cn(
        'fixed top-14 bottom-0 left-0 z-30 overflow-hidden border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-out',
        compact ? 'w-16' : 'w-60',
      )}
    >
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-center justify-between px-3 py-3">
          <SidebarToggle mode={mode} onToggle={onToggle} />
        </div>

        <nav aria-label="Main" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-6">
          {activeModule ? (
            <>
              <button
                type="button"
                data-testid="sidebar-back-to-modules"
                className={cn(rowClass, 'text-sidebar-foreground/70')}
                onClick={() => setActiveModuleSlug(null)}
              >
                <ChevronLeft className="size-4 shrink-0" aria-hidden="true" />
                {compact ? null : <span className="truncate">Modules</span>}
              </button>

              {activeModule.groups.map((group) => (
                <GroupMenu
                  key={group.slug}
                  moduleSlug={activeModule.slug}
                  group={group}
                  compact={compact}
                  isActive={pathname.startsWith(`/${activeModule.slug}/${group.slug}`)}
                />
              ))}
            </>
          ) : (
            modules.map((module) => (
              <ModuleButton
                key={module.slug}
                module={module}
                compact={compact}
                isActive={module.slug === resolveBreadcrumb(pathname)?.module.slug}
                onSelect={() => {
                  setActiveModuleSlug(module.slug);
                  onExpand();
                }}
              />
            ))
          )}
        </nav>
      </div>

      {/* The mark, oversized and barely there — the company's name is an olive
          tree, so the chrome carries it instead of a generic decoration. */}
      <Image
        src="/images/logo-ian2.png"
        alt=""
        aria-hidden="true"
        width={260}
        height={260}
        className="pointer-events-none absolute -bottom-14 -left-8 z-0 h-auto w-64 max-w-none opacity-[0.05] select-none dark:opacity-[0.07]"
      />
    </aside>
  );
}
