'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useT } from '@/lib/i18n/provider';
import type { AreaKey, NavItem, NavSection } from '@/lib/navigation/nav';
import { openGroupsStorageKey, type SidebarMode } from '@/lib/navigation/sidebar-preference';
import { cn } from '@/lib/utils';

/*
 * The shell navigation of every product (board F01, decided 2026-11-15): Overview
 * on top, then one collapsible **group card** per module of the catalog. The
 * whole sidebar collapses to a 64px rail, where each module opens a flyout with
 * the same routines. Each product keeps its own modules, icons and accent — the
 * accent comes from `data-product` on the shell root.
 *
 * What the rail *looks* like is pure CSS, keyed on `data-mode` of the closest
 * `group/nav` ancestor (`auto` = rail only below 1280px), so the server and the
 * browser render the same markup. What it *does* (open a flyout instead of
 * toggling a group) is decided in the browser by `useIsRail`.
 *
 * Tailwind only generates classes it can read literally, hence the spelled-out
 * variants below.
 */
const HIDE_ON_RAIL =
  'group-data-[mode=collapsed]/nav:hidden group-data-[mode=auto]/nav:max-xl:hidden';
const SHOW_ON_RAIL =
  'hidden group-data-[mode=collapsed]/nav:flex group-data-[mode=auto]/nav:max-xl:flex';
const CENTER_ON_RAIL =
  'group-data-[mode=collapsed]/nav:size-11 group-data-[mode=collapsed]/nav:justify-center group-data-[mode=collapsed]/nav:px-0 group-data-[mode=auto]/nav:max-xl:size-11 group-data-[mode=auto]/nav:max-xl:justify-center group-data-[mode=auto]/nav:max-xl:px-0';
const PLAIN_ON_RAIL =
  'group-data-[mode=collapsed]/nav:border-transparent group-data-[mode=collapsed]/nav:bg-transparent group-data-[mode=collapsed]/nav:pb-0 group-data-[mode=auto]/nav:max-xl:border-transparent group-data-[mode=auto]/nav:max-xl:bg-transparent group-data-[mode=auto]/nav:max-xl:pb-0';

const WIDE_QUERY = '(min-width: 1280px)';

function isActive(pathname: string, item: NavItem): boolean {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function subscribeToWidth(onChange: () => void): () => void {
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/** Whether the navigation currently *behaves* as the rail. The server assumes it doesn't (except when collapsed). */
export function useIsRail(mode: SidebarMode): boolean {
  return useSyncExternalStore(
    subscribeToWidth,
    () => mode === 'collapsed' || (mode === 'auto' && !window.matchMedia(WIDE_QUERY).matches),
    () => mode === 'collapsed',
  );
}

const OPEN_GROUPS_EVENT = 'oliveira:nav-open-groups';

function readOpenGroups(area: AreaKey): string {
  try {
    return window.localStorage.getItem(openGroupsStorageKey(area)) ?? '{}';
  } catch {
    return '{}'; // Storage unavailable (private window, blocked site data).
  }
}

function subscribeToOpenGroups(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  window.addEventListener(OPEN_GROUPS_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(OPEN_GROUPS_EVENT, onChange);
  };
}

/**
 * Which groups are open: what the person chose (per area, in localStorage),
 * else only the group holding the current page — it opens by itself.
 */
function useOpenGroups(area: AreaKey, currentGroupId: string | null) {
  const saved = useSyncExternalStore(
    subscribeToOpenGroups,
    () => readOpenGroups(area),
    () => '{}',
  );
  const choices = useMemo<Record<string, boolean>>(() => {
    try {
      const parsed: unknown = JSON.parse(saved);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, boolean>)
        : {};
    } catch {
      return {};
    }
  }, [saved]);

  const isOpen = useCallback(
    (id: string) => choices[id] ?? id === currentGroupId,
    [choices, currentGroupId],
  );

  const toggle = useCallback(
    (id: string) => {
      try {
        window.localStorage.setItem(
          openGroupsStorageKey(area),
          JSON.stringify({ ...choices, [id]: !isOpen(id) }),
        );
        window.dispatchEvent(new Event(OPEN_GROUPS_EVENT));
      } catch {
        // Not remembered: storage is unavailable.
      }
    },
    [area, choices, isOpen],
  );

  return { isOpen, toggle };
}

function IconTile({ item, isCurrent }: { item: { icon: NavItem['icon'] }; isCurrent: boolean }) {
  const Icon = item.icon;
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-[7px] bg-shell-active text-shell-text transition-colors',
        isCurrent && 'bg-accent-300/15 text-accent-300',
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}

interface ShellNavProps {
  area: AreaKey;
  sections: readonly NavSection[];
  /** `drawer` is always written out; `sidebar` follows `mode` (and the width, when `auto`). */
  variant: 'sidebar' | 'drawer';
  mode?: SidebarMode;
  onNavigate?: () => void;
}

export function ShellNav({
  area,
  sections,
  variant,
  mode = 'expanded',
  onNavigate,
}: ShellNavProps) {
  const t = useT();
  const pathname = usePathname();
  const isRail = useIsRail(variant === 'drawer' ? 'expanded' : mode);

  const [topSection, ...groups] = sections[0]?.labelKey ? [undefined, ...sections] : sections;
  const currentGroup = groups.find((section) =>
    section?.items.some((item) => isActive(pathname, item)),
  );
  const { isOpen, toggle } = useOpenGroups(area, currentGroup?.id ?? null);

  const nav = (
    <nav aria-label={t('shell.nav.label')} className="flex flex-col gap-1.5">
      {topSection?.items.map((item) => (
        <TopItem
          key={item.href}
          item={item}
          isRail={isRail}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      ))}
      {groups.map((section) =>
        section ? (
          <NavGroup
            key={section.id}
            section={section}
            isOpen={isOpen(section.id)}
            isCurrent={section.id === currentGroup?.id}
            isRail={isRail}
            pathname={pathname}
            onToggle={() => toggle(section.id)}
            onNavigate={onNavigate}
          />
        ) : null,
      )}
    </nav>
  );

  return (
    <TooltipProvider delayDuration={200}>
      {variant === 'drawer' ? (
        <div className="group/nav" data-mode="expanded">
          {nav}
        </div>
      ) : (
        nav
      )}
    </TooltipProvider>
  );
}

function TopItem({
  item,
  isRail,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  isRail: boolean;
  pathname: string;
  onNavigate?: (() => void) | undefined;
}) {
  const t = useT();
  const active = isActive(pathname, item);
  const label = t(item.labelKey);
  const [isTipOpen, setTipOpen] = useState(false);

  return (
    <Tooltip open={isRail && isTipOpen} onOpenChange={setTipOpen}>
      <TooltipTrigger asChild>
        <Link
          href={item.href}
          data-testid={item.testId}
          aria-current={active ? 'page' : undefined}
          aria-label={isRail ? label : undefined}
          {...(onNavigate ? { onClick: onNavigate } : {})}
          className={cn(
            'relative flex h-10 w-full items-center gap-3 rounded-lg pr-2.5 pl-2 text-sm text-shell-text transition-colors duration-100 outline-none hover:bg-shell-control hover:text-white focus-visible:ring-focus-shell',
            CENTER_ON_RAIL,
            'group-data-[mode=collapsed]/nav:mx-auto group-data-[mode=auto]/nav:max-xl:mx-auto',
            active && 'bg-shell-active font-medium text-white hover:bg-shell-active',
          )}
        >
          {active ? (
            <span
              aria-hidden="true"
              className="absolute top-2.5 bottom-2.5 left-0 w-[3px] rounded-r-full bg-accent-300 group-data-[mode=collapsed]/nav:-left-2.5 group-data-[mode=auto]/nav:max-xl:-left-2.5"
            />
          ) : null}
          <IconTile item={item} isCurrent={active} />
          <span className={cn('truncate', HIDE_ON_RAIL)}>{label}</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function SubItem({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: (() => void) | undefined;
}) {
  const t = useT();
  const active = isActive(pathname, item);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      data-testid={item.testId}
      aria-current={active ? 'page' : undefined}
      {...(onNavigate ? { onClick: onNavigate } : {})}
      className={cn(
        'relative flex h-[34px] items-center gap-2.5 rounded-md px-2.5 text-[13.5px] text-shell-text transition-colors duration-100 outline-none hover:bg-shell-control hover:text-white focus-visible:ring-focus-shell',
        active && 'bg-shell-active font-medium text-white hover:bg-shell-active',
      )}
    >
      {active ? (
        <span
          aria-hidden="true"
          className="absolute top-2 bottom-2 -left-3 w-[3px] rounded-full bg-accent-300"
        />
      ) : null}
      <Icon
        className={cn('size-4 shrink-0 text-shell-text-muted', active && 'text-accent-300')}
        aria-hidden="true"
      />
      <span className="truncate">{t(item.labelKey)}</span>
    </Link>
  );
}

function NavGroup({
  section,
  isOpen,
  isCurrent,
  isRail,
  pathname,
  onToggle,
  onNavigate,
}: {
  section: NavSection;
  isOpen: boolean;
  isCurrent: boolean;
  isRail: boolean;
  pathname: string;
  onToggle: () => void;
  onNavigate?: (() => void) | undefined;
}) {
  const t = useT();
  const itemsId = useId();
  const label = section.labelKey ? t(section.labelKey) : '';
  const Icon = section.icon ?? section.items[0]?.icon;
  const [isFlyoutOpen, setFlyoutOpen] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);
  const openedWithoutFocus = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const showFlyout = (withoutFocus: boolean) => {
    window.clearTimeout(closeTimer.current);
    if (isRail) {
      openedWithoutFocus.current = withoutFocus;
      setFlyoutOpen(true);
    }
  };
  const hideFlyoutSoon = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setFlyoutOpen(false), 140);
  };

  const handleFlyoutKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }
    const links = [...(contentRef.current?.querySelectorAll<HTMLAnchorElement>('a[href]') ?? [])];
    if (links.length === 0) {
      return;
    }
    event.preventDefault();
    const index = links.indexOf(document.activeElement as HTMLAnchorElement);
    const next =
      event.key === 'ArrowDown'
        ? (index + 1) % links.length
        : (index - 1 + links.length) % links.length;
    links[next]?.focus();
  };

  if (!Icon) {
    return null;
  }

  return (
    // Leaving the rail (expanding, or a wider window) hides a flyout left open.
    <Popover open={isRail && isFlyoutOpen} onOpenChange={setFlyoutOpen}>
      <div
        data-testid={`nav-group-${section.id}`}
        className={cn(
          'rounded-[10px] border border-transparent',
          isOpen && 'border-shell-border bg-shell-inset pb-1.5',
          PLAIN_ON_RAIL,
        )}
      >
        <PopoverAnchor asChild>
          <button
            type="button"
            aria-expanded={isRail ? isFlyoutOpen : isOpen}
            aria-controls={isRail ? undefined : itemsId}
            aria-label={isRail ? label : undefined}
            aria-haspopup={isRail ? 'menu' : undefined}
            onClick={() => (isRail ? showFlyout(false) : onToggle())}
            onMouseEnter={() => showFlyout(true)}
            onMouseLeave={hideFlyoutSoon}
            className={cn(
              'relative flex h-11 w-full items-center gap-3 rounded-[9px] pr-2.5 pl-[7px] text-left text-sm font-medium text-[#E6E8EC] transition-colors duration-100 outline-none hover:bg-shell-control hover:text-white focus-visible:ring-focus-shell',
              CENTER_ON_RAIL,
              'group-data-[mode=collapsed]/nav:mx-auto group-data-[mode=auto]/nav:max-xl:mx-auto',
              isCurrent &&
                'group-data-[mode=collapsed]/nav:bg-accent-300/15 group-data-[mode=auto]/nav:max-xl:bg-accent-300/15',
            )}
          >
            {isCurrent ? (
              <span
                aria-hidden="true"
                className="absolute top-3 bottom-3 -left-2.5 hidden w-[3px] rounded-r-full bg-accent-300 group-data-[mode=collapsed]/nav:block group-data-[mode=auto]/nav:max-xl:block"
              />
            ) : null}
            <IconTile item={{ icon: Icon }} isCurrent={isCurrent} />
            <span className={cn('flex-1 truncate', HIDE_ON_RAIL)}>{label}</span>
            <ChevronRight
              aria-hidden="true"
              className={cn(
                'size-4 shrink-0 text-shell-text-muted transition-transform duration-150 motion-reduce:transition-none',
                isOpen && 'rotate-90',
                HIDE_ON_RAIL,
              )}
            />
          </button>
        </PopoverAnchor>

        <div
          className={cn(
            'grid transition-[grid-template-rows] duration-150 motion-reduce:transition-none',
            isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
            HIDE_ON_RAIL,
          )}
        >
          <div id={itemsId} inert={!isOpen || isRail} className="min-h-0 overflow-hidden">
            <div className="relative flex flex-col gap-0.5 pt-0.5 pr-1.5 pl-8">
              <span
                aria-hidden="true"
                className="absolute top-1 bottom-1 left-[21px] w-px bg-shell-guide"
              />
              {section.items.map((item) => (
                <SubItem key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <PopoverContent
        ref={contentRef}
        side="right"
        align="start"
        sideOffset={12}
        data-shell
        data-testid={`nav-flyout-${section.id}`}
        onOpenAutoFocus={(event) => {
          if (openedWithoutFocus.current) {
            event.preventDefault();
          } else {
            event.preventDefault();
            contentRef.current?.querySelector<HTMLAnchorElement>('a[href]')?.focus();
          }
        }}
        onMouseEnter={() => window.clearTimeout(closeTimer.current)}
        onMouseLeave={hideFlyoutSoon}
        onKeyDown={handleFlyoutKeyDown}
        className="flex w-[236px] flex-col gap-0.5 rounded-[10px] border-shell-guide bg-shell-control p-2 text-shell-text shadow-[0_12px_32px_rgba(0,0,0,.38),0_2px_6px_rgba(0,0,0,.2)]"
      >
        <p className="mb-1 flex items-center gap-2.5 border-b border-shell-guide px-2 pt-1.5 pb-2 text-[13.5px] font-semibold text-white">
          <Icon className="size-4 text-accent-300" aria-hidden="true" />
          {label}
        </p>
        {section.items.map((item) => (
          <SubItem
            key={item.href}
            item={item}
            pathname={pathname}
            onNavigate={() => {
              setFlyoutOpen(false);
              onNavigate?.();
            }}
          />
        ))}
      </PopoverContent>
    </Popover>
  );
}

interface SidebarProps {
  area: AreaKey;
  sections: readonly NavSection[];
  mode: SidebarMode;
  onToggleMode: () => void;
}

/** 248px (or the 64px rail) from 1024px; below that the drawer takes over. */
export function Sidebar({ area, sections, mode, onToggleMode }: SidebarProps) {
  const t = useT();
  if (sections.length === 0) {
    return null;
  }

  return (
    <aside
      data-shell
      data-testid="dashboard-sidebar"
      data-mode={mode}
      className="group/nav fixed top-[52px] bottom-0 left-0 z-30 hidden w-62 flex-col border-r border-shell-border bg-shell-2 transition-[width] duration-150 motion-reduce:transition-none data-[mode=auto]:max-xl:w-16 data-[mode=collapsed]:w-16 lg:flex"
    >
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2.5 py-3.5">
        <ShellNav area={area} sections={sections} variant="sidebar" mode={mode} />
      </div>

      <div className="border-t border-shell-border px-2.5 py-2.5">
        <button
          type="button"
          data-testid="sidebar-collapse"
          aria-expanded="true"
          onClick={onToggleMode}
          className={cn(
            'flex h-10 w-full items-center gap-3 rounded-lg px-2 text-sm text-shell-text transition-colors outline-none hover:bg-shell-control hover:text-white focus-visible:ring-focus-shell',
            HIDE_ON_RAIL,
          )}
        >
          <PanelLeftClose
            className="size-[18px] shrink-0 text-shell-text-muted"
            aria-hidden="true"
          />
          <span className="flex-1 truncate text-left">{t('shell.nav.collapse')}</span>
          <kbd className="rounded border border-b-2 border-[#3A404B] px-1.5 font-mono text-[10.5px] leading-4 text-shell-text-muted">
            {t('shell.nav.shortcut')}
          </kbd>
        </button>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                data-testid="sidebar-expand"
                aria-expanded="false"
                aria-label={t('shell.nav.expand')}
                onClick={onToggleMode}
                className={cn(
                  'mx-auto size-11 items-center justify-center rounded-[9px] text-shell-text transition-colors outline-none hover:bg-shell-control hover:text-white focus-visible:ring-focus-shell',
                  SHOW_ON_RAIL,
                )}
              >
                <PanelLeftOpen className="size-[18px]" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {t('shell.nav.expand')} · {t('shell.nav.shortcut')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  );
}
