/**
 * Whether the sidebar is expanded or collapsed to the 64px rail (board F01) is a
 * per-browser preference kept in a cookie — read on the server by `ShellFor`, so
 * the first render already has the right width and nothing jumps on load.
 *
 * `auto` (no cookie yet) follows the width: expanded from 1280px, the rail from
 * 1024 to 1279px. Once the person toggles it, their choice holds at every width
 * from 1024px; below that the drawer takes over regardless.
 */
export const SIDEBAR_COOKIE = 'oliveira_sidebar';
export const SIDEBAR_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type SidebarMode = 'auto' | 'expanded' | 'collapsed';

export function parseSidebarMode(value: string | undefined): SidebarMode {
  return value === 'expanded' || value === 'collapsed' ? value : 'auto';
}

/** Client side only: remembers the choice for a year. */
export function saveSidebarMode(mode: Exclude<SidebarMode, 'auto'>): void {
  document.cookie = `${SIDEBAR_COOKIE}=${mode}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}

/** The groups a person left open, per area — local to the browser, like favorites. */
export function openGroupsStorageKey(area: string): string {
  return `oliveira:nav-open:${area}`;
}
