import 'server-only';

import { cache } from 'react';
import type { GridColumnPreferenceDto, GridColumnPreferenceItem } from '@oliveira/schemas';
import { unwrap } from '@/lib/api/client';
import { requestGridPreference, requestGridPreferenceSave } from '@/lib/api/grid-preferences';
import type { ActionResult } from '@/lib/actions';
import { requireSession } from '@/lib/session';

/**
 * The get/save pair every listing routine needs for its `GridColumnPreference`
 * (`docs/design/patterns/listing_pages.md`) — identical for People, Profiles
 * and Users but for the `gridKey` string, which used to mean six near-
 * duplicate files (a `_data-access/get-grid-preferences.ts` and an
 * `_actions/save-grid-preferences.ts` per routine). One call to this factory
 * replaces both; a routine's own files become a couple of lines re-exporting
 * what it returns under the routine's naming convention.
 *
 * Deliberately NOT a `'use server'` file itself — `savePreference` becomes a
 * real Server Action only once a routine's own `_actions/save-grid-preferences.ts`
 * (which does carry the directive) re-exports it, matching how every other
 * Server Action in this app is declared. `import 'server-only'` is what
 * keeps this module itself off the client bundle in the meantime.
 */
export function createGridPreferenceAccess(gridKey: string) {
  const getPreference = cache(async (): Promise<GridColumnPreferenceDto | null> => {
    const { token } = await requireSession();
    return unwrap(await requestGridPreference(token, gridKey));
  });

  async function savePreference(columns: GridColumnPreferenceItem[]): Promise<ActionResult> {
    const { token } = await requireSession();
    const result = await requestGridPreferenceSave(token, gridKey, { columns });

    if (!result.success) {
      return { success: false, message: result.error };
    }

    return { success: true };
  }

  return { getPreference, savePreference };
}
