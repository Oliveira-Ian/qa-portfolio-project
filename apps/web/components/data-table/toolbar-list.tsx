'use client';

import { useRouter } from 'next/navigation';
import type { Table } from '@tanstack/react-table';
import { Download, Filter, RefreshCw, Settings2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchInput } from './search-input';

interface ToolbarListProps<TData> {
  table: Table<TData>;
  testIdPrefix: string;
  onExport: () => void;
  onCustomize: () => void;
  onOpenFilters: () => void;
  /** Badges the Filters button when the routine's `FilterDrawer` has fields applied. */
  activeFilterCount?: number;
}

/**
 * The bar above every listing's grid — global search, then Export/
 * Customize/Refresh/Filters, in the same order as the spec's reference
 * layout. Nothing here is specific to a routine: business action buttons
 * (Add/Edit/Delete) live in the page's own header, not this toolbar.
 *
 * "Atualizar" is a plain `router.refresh()` — it only re-runs the Server
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
}: ToolbarListProps<TData>) {
  const router = useRouter();

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3"
      data-testid={`${testIdPrefix}-toolbar`}
    >
      <SearchInput
        value={table.getState().globalFilter ?? ''}
        onChange={(value) => table.setGlobalFilter(value)}
        testIdPrefix={testIdPrefix}
        className="w-full max-w-xs"
      />

      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onExport}
          data-testid={`${testIdPrefix}-toolbar-export`}
        >
          <Download aria-hidden="true" />
          Export
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCustomize}
          data-testid={`${testIdPrefix}-toolbar-customize`}
        >
          <Settings2 aria-hidden="true" />
          Customize
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.refresh()}
          data-testid={`${testIdPrefix}-toolbar-refresh`}
        >
          <RefreshCw aria-hidden="true" />
          Refresh
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenFilters}
          data-testid={`${testIdPrefix}-toolbar-filters`}
        >
          <Filter aria-hidden="true" />
          Filters
          {activeFilterCount > 0 ? (
            <Badge variant="outline" className="ml-0.5">
              {activeFilterCount}
            </Badge>
          ) : null}
        </Button>
      </div>
    </div>
  );
}
