'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { GridColumnPreferenceDto, GridColumnPreferenceItem } from '@oliveira/schemas';
import type { ActionResult } from '@/lib/actions';
import type { CustomizableColumn } from './grid-customization-modal';

export interface UseListingScreenOptions {
  gridPreference: GridColumnPreferenceDto | null;
  customizableColumns: CustomizableColumn[];
  saveGridPreferenceAction: (columns: GridColumnPreferenceItem[]) => Promise<ActionResult>;
  /** Structural columns appended after the data columns in the default order — e.g. the "⋮" actions column, which is never part of `customizableColumns` itself. */
  extraColumnOrder?: string[];
}

/**
 * Everything People, Profiles and Users repeated identically before this
 * existed: deriving `initialColumnVisibility`/`initialColumnOrder` from a
 * saved `GridColumnPreference` (falling back to each column's own declared
 * default), the three modal open/close states plus the export "remount to
 * reseed" nonce, and the save handler's toast pair. What's left in each
 * routine's own `*-list.tsx` is what's actually specific to it: columns,
 * filter fields, row actions, and its own delete flow (Users has none at
 * all, Profiles' and People's differ in id type — `number` vs `string` —
 * which is exactly the kind of thing this hook shouldn't have to know).
 */
export function useListingScreen({
  gridPreference,
  customizableColumns,
  saveGridPreferenceAction,
  extraColumnOrder = ['actions'],
}: UseListingScreenOptions) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportNonce, setExportNonce] = useState(0);

  const initialColumnVisibility = useMemo(() => {
    if (gridPreference) {
      return Object.fromEntries(
        gridPreference.columns.map((column) => [column.key, column.visible]),
      );
    }

    return Object.fromEntries(
      customizableColumns.map((column) => [column.key, column.defaultVisible ?? true]),
    );
  }, [gridPreference, customizableColumns]);

  const initialColumnOrder = useMemo(() => {
    const savedOrder = gridPreference?.columns.map((column) => column.key);
    const dataColumnOrder = savedOrder ?? customizableColumns.map((column) => column.key);
    return [...dataColumnOrder, ...extraColumnOrder];
  }, [gridPreference, customizableColumns, extraColumnOrder]);

  function openExport() {
    setExportNonce((nonce) => nonce + 1);
    setExportOpen(true);
  }

  async function handleSaveGridPreference(columns: GridColumnPreferenceItem[]) {
    const result = await saveGridPreferenceAction(columns);

    if (!result.success) {
      toast.error(result.message ?? 'Could not save your column preferences');
      return;
    }

    toast.success('Column preferences saved');
  }

  return {
    initialColumnVisibility,
    initialColumnOrder,
    filtersOpen,
    setFiltersOpen,
    customizeOpen,
    setCustomizeOpen,
    exportOpen,
    setExportOpen,
    exportNonce,
    openExport,
    handleSaveGridPreference,
  };
}
