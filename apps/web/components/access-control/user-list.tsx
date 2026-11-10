'use client';

import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';
import {
  PRODUCT_LABELS,
  type AccountDto,
  type GridColumnPreferenceDto,
  type GridColumnPreferenceItem,
  type Product,
} from '@oliveira/schemas';
import { DataTable } from '@/components/data-table/data-table';
import { ExportModal } from '@/components/data-table/export-modal';
import { FilterDrawer } from '@/components/data-table/filter-drawer';
import { GridCustomizationModal } from '@/components/data-table/grid-customization-modal';
import { Pagination } from '@/components/data-table/pagination';
import { ToolbarList } from '@/components/data-table/toolbar-list';
import { useDataTable } from '@/components/data-table/use-data-table';
import { useListingScreen } from '@/components/data-table/use-listing-screen';
import { useListNavigation } from '@/components/data-table/use-list-navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import type { ActionResult } from '@/lib/actions';
import { useT } from '@/lib/i18n/provider';
import { USER_CUSTOMIZABLE_COLUMNS, USER_EXPORT_COLUMNS, userColumns } from './user-columns';
import { USER_FILTER_FIELDS, USER_FILTERABLE_COLUMNS } from './user-filter-fields';

const TESTID_PREFIX = 'user-list';

interface UserListProps {
  product: Product;
  accounts: AccountDto[];
  /** Rows across every page — `accounts.length` is only the current page's. */
  total: number;
  gridPreference: GridColumnPreferenceDto | null;
  saveGridPreferenceAction: (columns: GridColumnPreferenceItem[]) => Promise<ActionResult>;
  /** The screen's own URL — a record opens at `${basePath}/:id`, its edit at `${basePath}/:id/edit`. */
  basePath: string;
}

/**
 * A product's users: the company's members as the product sees them, each with
 * the one profile they hold there. Shared by every product — the ERP's and the
 * FSM's screens differ only in `product` and `basePath`. Nobody is added or
 * removed here (that is the Platform's members and product access); the header
 * Edit, on one selected row, changes the person's profile, and a double click
 * opens the record.
 */
export function UserList({
  product,
  accounts,
  total,
  gridPreference,
  saveGridPreferenceAction,
  basePath,
}: UserListProps) {
  const t = useT();
  const router = useRouter();
  const { query, setQuery } = useListNavigation(USER_FILTERABLE_COLUMNS);
  const {
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
  } = useListingScreen({
    gridPreference,
    customizableColumns: USER_CUSTOMIZABLE_COLUMNS,
    saveGridPreferenceAction,
  });

  const table = useDataTable({
    data: accounts,
    columns: userColumns,
    getRowId: (account) => String(account.id),
    rowCount: total,
    query,
    onQueryChange: setQuery,
    initialColumnVisibility,
    initialColumnOrder,
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedId = selectedRows.length === 1 ? selectedRows[0]!.original.id : undefined;
  const productName = PRODUCT_LABELS[product];

  return (
    <div data-testid={`${TESTID_PREFIX}-container`}>
      <PageHeader
        title={t('accessControl.users.title')}
        titleTestId={`${TESTID_PREFIX}-title`}
        meta={t('accessControl.users.meta', { count: total })}
        description={t('accessControl.users.lead', { product: productName })}
        actions={
          <Button
            variant="outline"
            data-testid="user-button-edit"
            disabled={selectedId === undefined}
            onClick={() =>
              selectedId !== undefined && router.push(`${basePath}/${selectedId}/edit`)
            }
          >
            <Pencil aria-hidden="true" />
            {t('accessControl.users.edit')}
          </Button>
        }
      />

      <div className="mb-4">
        <ToolbarList
          table={table}
          testIdPrefix={TESTID_PREFIX}
          onExport={openExport}
          onCustomize={() => setCustomizeOpen(true)}
          onOpenFilters={() => setFiltersOpen(true)}
          activeFilterCount={table.getState().columnFilters.length}
          filterFields={USER_FILTER_FIELDS}
          searchPlaceholder={t('accessControl.users.search')}
        />
      </div>

      <div
        className="overflow-hidden rounded-xl border border-border bg-surface"
        data-testid={`${TESTID_PREFIX}-table-card`}
      >
        <DataTable
          table={table}
          testIdPrefix={TESTID_PREFIX}
          onRowOpen={(account) => router.push(`${basePath}/${account.id}`)}
          getRowLabel={(account) => account.personName}
          emptyState={{
            title: t('accessControl.users.empty.title'),
            description: t('accessControl.users.empty.body', { product: productName }),
          }}
        />
      </div>
      <Pagination table={table} testIdPrefix={TESTID_PREFIX} />

      <FilterDrawer
        table={table}
        fields={USER_FILTER_FIELDS}
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        testIdPrefix={TESTID_PREFIX}
      />

      <GridCustomizationModal
        table={table}
        columns={USER_CUSTOMIZABLE_COLUMNS}
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
        onSave={handleSaveGridPreference}
        testIdPrefix={TESTID_PREFIX}
      />

      <ExportModal
        key={exportNonce}
        table={table}
        columns={USER_EXPORT_COLUMNS}
        open={exportOpen}
        onOpenChange={setExportOpen}
        fileName="users"
        testIdPrefix={TESTID_PREFIX}
      />
    </div>
  );
}
