'use client';

import { useRouter } from 'next/navigation';
import type { Table } from '@tanstack/react-table';
import { Download, Filter, RefreshCw, Settings2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { useT } from '@/lib/i18n/provider';
import { ActiveFilters } from './active-filters';
import type { FilterDrawerField } from './filter-drawer';

interface ToolbarListProps<TData> {
  table: Table<TData>;
  testIdPrefix: string;
  onExport: () => void;
  onCustomize: () => void;
  onOpenFilters: () => void;
  /** Badges the Filters button when the routine's `FilterDrawer` has fields applied. */
  activeFilterCount?: number;
  /** The routine's curated filter fields — they name the removable tags beside the Filters button. */
  filterFields?: FilterDrawerField[];
  /** What the search box says before anything is typed — e.g. "Search by name, code or document". */
  searchPlaceholder?: string;
}

/**
 * The bar above every listing's grid (design S14): global search, the Filters
 * button with the active filters as removable tags next to it, and on the right
 * the ghost tools — Export, Customize, Refresh. Nothing here is specific to a
 * routine: business action buttons (Add/Edit/Delete) live in the page's own
 * header, not this toolbar.
 *
 * Refresh is a plain `router.refresh()` — it only re-runs the Server
 * Component fetch. Search/sort/filter/selection all live in `table`'s own
 * state (`useDataTable`), which isn't reset by a server refetch, so nothing
 * needs to be saved and restored around the refresh.
 */
export function ToolbarList<TData>({
  table,
  testIdPrefix,
  onExport,
  onCustomize,
  onOpenFilters,
  activeFilterCount = 0,
  filterFields,
  searchPlaceholder,
}: ToolbarListProps<TData>) {
  const t = useT();
  const router = useRouter();

  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-2"
      data-testid={`${testIdPrefix}-toolbar`}
    >
      <SearchInput
        value={table.getState().globalFilter ?? ''}
        onChange={(value) => table.setGlobalFilter(value)}
        testIdPrefix={testIdPrefix}
        {...(searchPlaceholder ? { placeholder: searchPlaceholder } : {})}
        className="w-full max-w-80 min-w-56 flex-1"
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onOpenFilters}
        data-testid={`${testIdPrefix}-toolbar-filters`}
      >
        <Filter aria-hidden="true" />
        {t('table.toolbar.filters')}
        {activeFilterCount > 0 ? (
          <Badge variant="admin" className="ml-0.5 h-5 px-1.5 text-[11px]">
            {activeFilterCount}
          </Badge>
        ) : null}
      </Button>

      <ActiveFilters
        table={table}
        {...(filterFields ? { fields: filterFields } : {})}
        testIdPrefix={testIdPrefix}
      />

      <div className="ml-auto flex items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onExport}
          data-testid={`${testIdPrefix}-toolbar-export`}
        >
          <Download aria-hidden="true" />
          {t('table.toolbar.export')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCustomize}
          data-testid={`${testIdPrefix}-toolbar-customize`}
        >
          <Settings2 aria-hidden="true" />
          {t('table.toolbar.customize')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => router.refresh()}
          aria-label={t('table.toolbar.refresh')}
          title={t('table.toolbar.refresh')}
          data-testid={`${testIdPrefix}-toolbar-refresh`}
        >
          <RefreshCw aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
