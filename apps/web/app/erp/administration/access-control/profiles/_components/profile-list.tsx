'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { GridColumnPreferenceDto, ProfileDto } from '@oliveira/schemas';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
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
import { translateApiMessage } from '@/lib/i18n/api-messages';
import { useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import { deleteProfileAction } from '../_actions/delete-profile';
import { saveProfileGridPreferenceAction } from '../_actions/save-grid-preferences';
import {
  PROFILE_CUSTOMIZABLE_COLUMNS,
  PROFILE_EXPORT_COLUMNS,
  profileColumns,
} from './profile-columns';
import { PROFILE_FILTER_FIELDS, PROFILE_FILTERABLE_COLUMNS } from './profile-filter-fields';

const TESTID_PREFIX = 'profile-list';

interface ProfileListProps {
  profiles: ProfileDto[];
  /** Total rows across every page — `profiles.length` is just the current page's. */
  total: number;
  gridPreference: GridColumnPreferenceDto | null;
}

/**
 * A thin composition of `components/data-table/`'s shared listing
 * infrastructure — same shape as People (`person-list.tsx`), the first
 * routine built on it. This screen is entirely gated at the page level by
 * `profile:manage`, so Add/Edit/Delete have no per-permission checks the way
 * Person's do.
 *
 * Delete is disabled — per row and in the header — for any `isSystem`
 * profile (Administrator, Default User): the API itself rejects deleting
 * one with a 409, this just avoids the round trip.
 */
export function ProfileList({ profiles, total, gridPreference }: ProfileListProps) {
  const t = useT();
  const router = useRouter();
  const { query, setQuery } = useListNavigation(PROFILE_FILTERABLE_COLUMNS);
  const [isDeleting, startDeleting] = useTransition();
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[] | null>(null);
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
    customizableColumns: PROFILE_CUSTOMIZABLE_COLUMNS,
    saveGridPreferenceAction: saveProfileGridPreferenceAction,
  });

  // Shared by the "⋮" column cell and `DataTable`'s `rowActions` (right-click
  // menu) — declared once so both paths always show the identical list.
  const getRowActions = useCallback(
    (profile: ProfileDto): RowAction[] => [
      {
        key: 'edit',
        label: t('erp.profiles.edit'),
        icon: Pencil,
        onSelect: () => router.push(ROUTES.profiles.edit(profile.id)),
        testId: `${TESTID_PREFIX}-row-action-edit`,
      },
      {
        key: 'delete',
        label: t('erp.profiles.delete'),
        icon: Trash2,
        variant: 'destructive',
        disabled: profile.isSystem,
        onSelect: () => setPendingDeleteIds([profile.id]),
        testId: `${TESTID_PREFIX}-row-action-delete`,
      },
    ],
    [router, t],
  );

  const columns = useMemo<ColumnDef<ProfileDto>[]>(
    () => [
      ...profileColumns,
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
    [getRowActions],
  );

  const table = useDataTable({
    data: profiles,
    columns,
    getRowId: (profile) => String(profile.id),
    rowCount: total,
    query,
    onQueryChange: setQuery,
    initialColumnVisibility,
    initialColumnOrder,
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedId = selectedRows.length === 1 ? selectedRows[0]!.original.id : undefined;
  const hasSystemSelected = selectedRows.some((row) => row.original.isSystem);
  const isMultiDelete = (pendingDeleteIds?.length ?? 0) > 1;

  function handleEdit() {
    if (selectedId) {
      router.push(ROUTES.profiles.edit(selectedId));
    }
  }

  function handleConfirmDelete() {
    if (!pendingDeleteIds) {
      return;
    }

    startDeleting(async () => {
      const result = await deleteProfileAction(pendingDeleteIds);
      const message = translateApiMessage(result.message ?? '', t);

      if (!result.success) {
        toast.error(message);
        return;
      }

      toast.success(message);
      table.resetRowSelection();
      setPendingDeleteIds(null);
      router.refresh();
    });
  }

  return (
    <div data-testid={`${TESTID_PREFIX}-container`}>
      <PageHeader
        title={t('erp.profiles.title')}
        titleTestId={`${TESTID_PREFIX}-title`}
        meta={t('erp.profiles.meta', { count: total })}
        actions={
          <>
            <Button
              variant="destructive-soft"
              data-testid="profile-button-delete"
              disabled={selectedRows.length === 0 || isDeleting || hasSystemSelected}
              onClick={() => setPendingDeleteIds(selectedRows.map((row) => row.original.id))}
            >
              <Trash2 aria-hidden="true" />
              {t('erp.profiles.delete')}
            </Button>
            <Button
              variant="outline"
              data-testid="profile-button-edit"
              disabled={!selectedId}
              onClick={handleEdit}
            >
              <Pencil aria-hidden="true" />
              {t('erp.profiles.edit')}
            </Button>
            <Button asChild data-testid="profile-button-add">
              <Link href={ROUTES.profiles.new}>
                <Plus aria-hidden="true" />
                {t('erp.profiles.add')}
              </Link>
            </Button>
          </>
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
          filterFields={PROFILE_FILTER_FIELDS}
        />
      </div>

      <div
        className="overflow-hidden rounded-xl border border-border bg-surface"
        data-testid={`${TESTID_PREFIX}-table-card`}
      >
        <DataTable
          table={table}
          testIdPrefix={TESTID_PREFIX}
          rowActions={getRowActions}
          getRowLabel={(profile) => profile.name}
          emptyState={{
            title: t('erp.profiles.empty.title'),
            description: t('erp.profiles.empty.body'),
            action: (
              <Button asChild data-testid="profile-empty-button-add">
                <Link href={ROUTES.profiles.new}>
                  <Plus aria-hidden="true" />
                  {t('erp.profiles.addFirst')}
                </Link>
              </Button>
            ),
          }}
        />
      </div>
      <Pagination table={table} testIdPrefix={TESTID_PREFIX} />

      <FilterDrawer
        table={table}
        fields={PROFILE_FILTER_FIELDS}
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        testIdPrefix={TESTID_PREFIX}
      />

      <GridCustomizationModal
        table={table}
        columns={PROFILE_CUSTOMIZABLE_COLUMNS}
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
        onSave={handleSaveGridPreference}
        testIdPrefix={TESTID_PREFIX}
      />

      <ExportModal
        key={exportNonce}
        table={table}
        columns={PROFILE_EXPORT_COLUMNS}
        open={exportOpen}
        onOpenChange={setExportOpen}
        fileName="profiles"
        testIdPrefix={TESTID_PREFIX}
      />

      <AlertDialog
        open={pendingDeleteIds !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeleteIds(null);
          }
        }}
      >
        <AlertDialogContent data-testid="profile-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isMultiDelete
                ? t('erp.profiles.deleteDialog.titleMany', { count: pendingDeleteIds?.length ?? 0 })
                : t('erp.profiles.deleteDialog.titleOne')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isMultiDelete
                ? t('erp.profiles.deleteDialog.bodyMany')
                : t('erp.profiles.deleteDialog.bodyOne')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="ghost" data-testid="profile-delete-cancel">
              {t('erp.profiles.deleteDialog.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              data-testid="profile-delete-confirm"
              onClick={handleConfirmDelete}
            >
              {t('erp.profiles.deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
