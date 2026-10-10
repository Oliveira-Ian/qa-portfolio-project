'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import type {
  AccountDto,
  AccountRole,
  GridColumnPreferenceDto,
  ProfileDto,
} from '@oliveira/schemas';
import { ActiveFilters } from '@/components/data-table/active-filters';
import { DataTable } from '@/components/data-table/data-table';
import { ExportModal } from '@/components/data-table/export-modal';
import { FilterDrawer } from '@/components/data-table/filter-drawer';
import { GridCustomizationModal } from '@/components/data-table/grid-customization-modal';
import { Pagination } from '@/components/data-table/pagination';
import { RowActionsMenu, type RowAction } from '@/components/data-table/row-actions-menu';
import { ToolbarList } from '@/components/data-table/toolbar-list';
import { useDataTable } from '@/components/data-table/use-data-table';
import { useListingScreen } from '@/components/data-table/use-listing-screen';
import { useListNavigation } from '@/components/data-table/use-list-navigation';
import { PageHeader } from '@/components/layout/page-header';
import { updateAccountAction } from '../_actions/update-account';
import { saveAccountGridPreferenceAction } from '../_actions/save-grid-preferences';
import {
  ACCOUNT_CUSTOMIZABLE_COLUMNS,
  ACCOUNT_EXPORT_COLUMNS,
  buildAccountColumns,
} from './account-columns';
import { ACCOUNT_FILTER_FIELDS, ACCOUNT_FILTERABLE_COLUMNS } from './account-filter-fields';
import { ManageProfilesDialog } from './manage-profiles-dialog';

const TESTID_PREFIX = 'account-list';

interface AccountListProps {
  accounts: AccountDto[];
  /** Total rows across every page — `accounts.length` is just the current page's. */
  total: number;
  profiles: ProfileDto[];
  gridPreference: GridColumnPreferenceDto | null;
}

/**
 * A thin composition of `components/data-table/`'s shared listing
 * infrastructure — same shape as People and Profiles, minus the pieces this
 * screen has no use for: there's no Add/Edit/Delete header (accounts are
 * created from the Person edit page's Account section, never deleted), so
 * row selection is off (`enableSelection={false}`) — nothing here needs a
 * selected row first. Role, active/inactive and the profile-link count are
 * all directly interactive cells (`account-columns.tsx`), not read-only
 * values, which is why those columns are built by a function taking
 * callbacks rather than declared as a static array.
 */
export function AccountList({ accounts, total, profiles, gridPreference }: AccountListProps) {
  const router = useRouter();
  const { query, setQuery } = useListNavigation(ACCOUNT_FILTERABLE_COLUMNS);
  const [isPending, startTransition] = useTransition();
  const [managingAccountId, setManagingAccountId] = useState<number | null>(null);
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
    customizableColumns: ACCOUNT_CUSTOMIZABLE_COLUMNS,
    saveGridPreferenceAction: saveAccountGridPreferenceAction,
  });

  const managingAccount = accounts.find((account) => account.id === managingAccountId) ?? null;

  const handleRoleChange = useCallback(
    (account: AccountDto, role: AccountRole) => {
      if (role === account.role) {
        return;
      }

      startTransition(async () => {
        const result = await updateAccountAction(account.id, { role });

        if (!result.success) {
          toast.error(result.message ?? 'Could not update the role');
          return;
        }

        toast.success('Role updated');
        router.refresh();
      });
    },
    [router],
  );

  const handleToggleActive = useCallback(
    (account: AccountDto) => {
      startTransition(async () => {
        const result = await updateAccountAction(account.id, { active: !account.active });

        if (!result.success) {
          toast.error(result.message ?? 'Could not update the account');
          return;
        }

        toast.success(account.active ? 'Account deactivated' : 'Account activated');
        router.refresh();
      });
    },
    [router],
  );

  const handleManageProfiles = useCallback((account: AccountDto) => {
    setManagingAccountId(account.id);
  }, []);

  // Shared by the Profiles column's own button and `DataTable`'s
  // `rowActions` (⋮ menu / right-click) — declared once so both paths open
  // the identical dialog.
  const getRowActions = useCallback(
    (account: AccountDto): RowAction[] => [
      {
        key: 'manage-profiles',
        label: 'Manage profiles',
        icon: ShieldCheck,
        onSelect: () => handleManageProfiles(account),
        testId: `${TESTID_PREFIX}-row-action-manage-profiles`,
      },
    ],
    [handleManageProfiles],
  );

  const columns = useMemo<ColumnDef<AccountDto>[]>(
    () => [
      ...buildAccountColumns({
        onRoleChange: handleRoleChange,
        onToggleActive: handleToggleActive,
        onManageProfiles: handleManageProfiles,
        isPending,
      }),
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <RowActionsMenu
            actions={getRowActions(row.original)}
            testId={`${TESTID_PREFIX}-row-actions-trigger`}
          />
        ),
      },
    ],
    [isPending, handleRoleChange, handleToggleActive, handleManageProfiles, getRowActions],
  );

  const table = useDataTable({
    data: accounts,
    columns,
    getRowId: (account) => String(account.id),
    rowCount: total,
    query,
    onQueryChange: setQuery,
    initialColumnVisibility,
    initialColumnOrder,
  });

  return (
    <div data-testid="users-page-container">
      <PageHeader
        eyebrow="Settings"
        title="Users"
        description="Who can sign in to Oliveira ERP, and what they can do."
        titleTestId="users-page-title"
      />

      <div className="mb-4">
        <ToolbarList
          table={table}
          testIdPrefix={TESTID_PREFIX}
          onExport={openExport}
          onCustomize={() => setCustomizeOpen(true)}
          onOpenFilters={() => setFiltersOpen(true)}
          activeFilterCount={table.getState().columnFilters.length}
        />
      </div>

      <ActiveFilters table={table} fields={ACCOUNT_FILTER_FIELDS} testIdPrefix={TESTID_PREFIX} />

      <div
        className="mt-4 overflow-hidden rounded-lg border border-border bg-card shadow-card"
        data-testid={`${TESTID_PREFIX}-table-card`}
      >
        <DataTable
          table={table}
          testIdPrefix={TESTID_PREFIX}
          rowActions={getRowActions}
          enableSelection={false}
          emptyState={{
            title: 'No accounts yet',
            description: 'Accounts are created from a person’s own record, not from here.',
          }}
        />
        <Pagination table={table} testIdPrefix={TESTID_PREFIX} />
      </div>

      <FilterDrawer
        table={table}
        fields={ACCOUNT_FILTER_FIELDS}
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        testIdPrefix={TESTID_PREFIX}
      />

      <GridCustomizationModal
        table={table}
        columns={ACCOUNT_CUSTOMIZABLE_COLUMNS}
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
        onSave={handleSaveGridPreference}
        testIdPrefix={TESTID_PREFIX}
      />

      <ExportModal
        key={exportNonce}
        table={table}
        columns={ACCOUNT_EXPORT_COLUMNS}
        open={exportOpen}
        onOpenChange={setExportOpen}
        fileName="users"
        testIdPrefix={TESTID_PREFIX}
      />

      {managingAccount ? (
        <ManageProfilesDialog
          key={managingAccount.id}
          account={managingAccount}
          profiles={profiles}
          open={managingAccountId !== null}
          onOpenChange={(open) => {
            if (!open) {
              setManagingAccountId(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}
