'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Copy, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type {
  GridColumnPreferenceDto,
  GridColumnPreferenceItem,
  Product,
  ProfileDto,
} from '@oliveira/schemas';
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
import { ToolbarList } from '@/components/data-table/toolbar-list';
import { useDataTable } from '@/components/data-table/use-data-table';
import { useListingScreen } from '@/components/data-table/use-listing-screen';
import { useListNavigation } from '@/components/data-table/use-list-navigation';
import { PageHeader } from '@/components/layout/page-header';
import type { ActionResult } from '@/lib/actions';
import { translateApiMessage } from '@/lib/i18n/api-messages';
import { useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import {
  PROFILE_CUSTOMIZABLE_COLUMNS,
  PROFILE_EXPORT_COLUMNS,
  profileColumns,
} from './profile-columns';
import { PROFILE_FILTER_FIELDS, PROFILE_FILTERABLE_COLUMNS } from './profile-filter-fields';

const TESTID_PREFIX = 'profile-list';

/** The four pages of a product's profile routine. */
export interface ProfileRoutes {
  list: string;
  new: string;
  view: (id: number) => string;
  edit: (id: number) => string;
}

/**
 * Each product's profile pages. Chosen here, by `product`, rather than passed
 * in: a page (a Server Component) can't hand functions to a Client Component.
 */
export const PROFILE_ROUTES: Record<Product, ProfileRoutes> = {
  ERP: ROUTES.profiles,
  FSM: ROUTES.fsm.profiles,
};

interface ProfileListProps {
  profiles: ProfileDto[];
  /** Total rows across every page — `profiles.length` is just the current page's. */
  total: number;
  gridPreference: GridColumnPreferenceDto | null;
  product: Product;
  deleteAction: (ids: number[]) => Promise<ActionResult>;
  duplicateAction: (id: number) => Promise<ActionResult & { id?: number }>;
  saveGridPreferenceAction: (columns: GridColumnPreferenceItem[]) => Promise<ActionResult>;
}

/**
 * A thin composition of `components/data-table/`'s shared listing
 * infrastructure — same shape as People (`person-list.tsx`), the first
 * routine built on it. This screen is entirely gated at the page level by
 * `profile:manage`, so Add/Edit/Delete have no per-permission checks the way
 * Person's do.
 *
 * Shared by every product's profile screen: the ERP's and the FSM's differ in
 * their routes and Server Actions only, which the page hands in.
 *
 * Delete is disabled — per row and in the header — for any `isSystem`
 * profile (Administrator, Default User): the API itself rejects deleting
 * one with a 409, this just avoids the round trip.
 */
export function ProfileList({
  profiles,
  total,
  gridPreference,
  product,
  deleteAction,
  duplicateAction,
  saveGridPreferenceAction,
}: ProfileListProps) {
  const t = useT();
  const routes = PROFILE_ROUTES[product];
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
    saveGridPreferenceAction,
  });

  const columns = profileColumns;

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
      router.push(routes.edit(selectedId));
    }
  }

  /** A copy of the selected profile, opened for editing — the usual way to start a new one. */
  function handleDuplicate() {
    if (!selectedId) {
      return;
    }

    startDeleting(async () => {
      const result = await duplicateAction(selectedId);

      if (!result.success || result.id === undefined) {
        toast.error(translateApiMessage(result.message ?? '', t));
        return;
      }

      toast.success(t('accessControl.profiles.duplicated'));
      router.push(routes.edit(result.id));
    });
  }

  function handleConfirmDelete() {
    if (!pendingDeleteIds) {
      return;
    }

    startDeleting(async () => {
      const result = await deleteAction(pendingDeleteIds);
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
        title={t('accessControl.profiles.title')}
        titleTestId={`${TESTID_PREFIX}-title`}
        meta={t('accessControl.profiles.meta', { count: total })}
        actions={
          <>
            <Button
              variant="destructive-soft"
              data-testid="profile-button-delete"
              disabled={selectedRows.length === 0 || isDeleting || hasSystemSelected}
              onClick={() => setPendingDeleteIds(selectedRows.map((row) => row.original.id))}
            >
              <Trash2 aria-hidden="true" />
              {t('accessControl.profiles.delete')}
            </Button>
            <Button
              variant="outline"
              data-testid="profile-button-duplicate"
              disabled={!selectedId || isDeleting}
              onClick={handleDuplicate}
            >
              <Copy aria-hidden="true" />
              {t('accessControl.profiles.duplicate')}
            </Button>
            <Button
              variant="edit"
              data-testid="profile-button-edit"
              disabled={!selectedId}
              onClick={handleEdit}
            >
              <Pencil aria-hidden="true" />
              {t('accessControl.profiles.edit')}
            </Button>
            <Button asChild variant="create" data-testid="profile-button-add">
              <Link href={routes.new}>
                <Plus aria-hidden="true" />
                {t('accessControl.profiles.add')}
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
          onRowOpen={(profile) => router.push(routes.view(profile.id))}
          getRowLabel={(profile) => profile.name}
          emptyState={{
            title: t('accessControl.profiles.empty.title'),
            description: t('accessControl.profiles.empty.body'),
            action: (
              <Button asChild variant="create" data-testid="profile-empty-button-add">
                <Link href={routes.new}>
                  <Plus aria-hidden="true" />
                  {t('accessControl.profiles.addFirst')}
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
                ? t('accessControl.profiles.deleteDialog.titleMany', {
                    count: pendingDeleteIds?.length ?? 0,
                  })
                : t('accessControl.profiles.deleteDialog.titleOne')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isMultiDelete
                ? t('accessControl.profiles.deleteDialog.bodyMany')
                : t('accessControl.profiles.deleteDialog.bodyOne')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="ghost" data-testid="profile-delete-cancel">
              {t('accessControl.profiles.deleteDialog.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              data-testid="profile-delete-confirm"
              onClick={handleConfirmDelete}
            >
              {t('accessControl.profiles.deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
