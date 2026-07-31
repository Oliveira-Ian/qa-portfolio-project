'use client';

import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'oliveira_favorite_routines';

const listeners = new Set<() => void>();
let cachedSnapshot: Set<string> | null = null;

function readFromStorage(): Set<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : []);
  } catch {
    return new Set();
  }
}

/**
 * `useSyncExternalStore` requires a referentially stable snapshot when
 * nothing changed — recomputing a fresh `Set` on every call would make React
 * think the store never stops changing. Caching it here, invalidated only by
 * `writeFavorites` (the sole writer in this module), satisfies that.
 */
function getSnapshot(): Set<string> {
  cachedSnapshot ??= readFromStorage();
  return cachedSnapshot;
}

const EMPTY_SET: Set<string> = new Set();

/** Same stable-reference requirement as `getSnapshot` — a fresh `Set` per call would loop. */
function getServerSnapshot(): Set<string> {
  return EMPTY_SET;
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function writeFavorites(next: Set<string>): void {
  cachedSnapshot = next;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  listeners.forEach((listener) => listener());
}

/**
 * Favorited routines, keyed by their catalog `href` (`/records/people/…`).
 * `localStorage`-only for now — per-account persistence would need a table
 * and an API, out of scope until the favorite feature earns it.
 */
export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const isFavorite = useCallback((href: string) => favorites.has(href), [favorites]);

  const toggleFavorite = useCallback(
    (href: string) => {
      const next = new Set(favorites);

      if (next.has(href)) {
        next.delete(href);
      } else {
        next.add(href);
      }

      writeFavorites(next);
    },
    [favorites],
  );

  return { favorites, isFavorite, toggleFavorite };
}
