'use client';

import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'oliveira_sidebar_mode';

export type SidebarMode = 'expanded' | 'compact';

const listeners = new Set<() => void>();

function getSnapshot(): SidebarMode {
  return window.localStorage.getItem(STORAGE_KEY) === 'compact' ? 'compact' : 'expanded';
}

/** No `localStorage` during SSR — the client corrects on the first paint after hydration. */
function getServerSnapshot(): SidebarMode {
  return 'expanded';
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function writeMode(next: SidebarMode): void {
  window.localStorage.setItem(STORAGE_KEY, next);
  listeners.forEach((listener) => listener());
}

/**
 * Whether the sidebar shows icon+label or icons only, persisted across
 * visits. `localStorage` is exactly the "external store" `useSyncExternalStore`
 * exists for — it reads a snapshot the way React expects (cheap, referentially
 * stable when nothing changed) instead of a `useEffect` racing to correct a
 * default after mount.
 */
export function useSidebarMode() {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setMode = useCallback((next: SidebarMode) => writeMode(next), []);
  const toggle = useCallback(() => writeMode(mode === 'expanded' ? 'compact' : 'expanded'), [mode]);

  return { mode, setMode, toggle };
}
