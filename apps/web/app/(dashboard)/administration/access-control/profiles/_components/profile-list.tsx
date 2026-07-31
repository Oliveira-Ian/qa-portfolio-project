'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type {
  GridColumnPreferenceDto,
  GridColumnPreferenceItem,
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
import { RowActionsMenu, type RowAction } from '@/components/data-table/row-actions-menu';
import { ToolbarList } from '@/components/data-table/toolbar-list';
import { useDataTable } from '@/components/data-table/use-data-table';
import { PageHeader } from '@/components/layout/page-header';
import { formatCount } from '@/lib/format';
import { ROUTES } from '@/lib/navigation/routes';
import { deleteProfileAction } from '../_actions/delete-profile';
import { saveProfileGridPreferenceAction } from '../_actions/save-grid-preferences';
import {
  PROFILE_CUSTOMIZABLE_COLUMNS,
  PROFILE_DEFAULT_VISIBLE_KEYS,
  PROFILE_EXPORT_COLUMNS,
  profileColumns,
} from './profile-columns';
import { PROFILE_FILTER_FIELDS } from './profile-filter-fields';

const TESTID_PREFIX = 'profile-list';

interface ProfileListProps {
  profiles: ProfileDto[];
  gridPreference: GridColumnPreferenceDto | null;
}

/**
 * A thin composition of `components/data-table/`'s shared listing
 * infrastructure — same shape as People (`person-list.tsx`), the first
 * routine built on it. This screen is entirely ADMIN-gated at the page level
 * (`perfis/page.tsx`), so Add/Edit/Delete have no per-permission checks the
 * way Person's do.
 *
 * Delete is disabled — per row and in the header — for any `isSystem`
 * profile (Administrator, Default User): the API itself rejects deleting
 * one with a 409, this just avoids the round trip.
 */
export function ProfileList({ profiles, gridPreference }: ProfileListProps) {
  const router = useRouter();
  const [isDeleting, startDeleting] = useTransition();
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[] | null>(null);
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
      PROFILE_CUSTOMIZABLE_COLUMNS.map((column) => [
        column.key,
        PROFILE_DEFAULT_VISIBLE_KEYS.has(column.key),
      ]),
    );
  }, [gridPreference]);

  const initialColumnOrder = useMemo(() => {
    const savedOrder = gridPreference?.columns.map((column) => column.key);
    const dataColumnOrder = savedOrder ?? PROFILE_CUSTOMIZABLE_COLUMNS.map((column) => column.key);
    return [...dataColumnOrder, 'actions'];
  }, [gridPreference]);

  // Shared by the "⋮" column cell and `DataTable`'s `rowActions` (right-click
  // menu) — declared once so both paths always show the identical list.
  const getRowActions = useCallback(
    (profile: ProfileDto): RowAction[] => [
      {
        key: 'edit',
        label: 'Edit',
        icon: Pencil,
        onSelect: () => router.push(ROUTES.profiles.edit(profile.id)),
        testId: `${TESTID_PREFIX}-row-action-edit`,
      },
      {
        key: 'delete',
        label: 'Delete',
        icon: Trash2,
        variant: 'destructive',
        disabled: profile.isSystem,
        onSelect: () => setPendingDeleteIds([profile.id]),
        testId: `${TESTID_PREFIX}-row-action-delete`,
      },
    ],
    [router],
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

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      table.resetRowSelection();
      setPendingDeleteIds(null);
      router.refresh();
    });
  }

  async function handleSaveGridPreference(preferenceColumns: GridColumnPreferenceItem[]) {
    const result = await saveProfileGridPreferenceAction(preferenceColumns);

    if (!result.success) {
      toast.error(result.message ?? 'Could not save your column preferences');
      return;
    }

    toast.success('Column preferences saved');
  }

  return (
    <div data-testid={`${TESTID_PREFIX}-container`}>
      <PageHeader
        eyebrow="Access control"
        title="Profiles"
        titleTestId={`${TESTID_PREFIX}-title`}
        meta={
          <p className="eyebrow mt-3 text-muted-foreground">
            <span className="tabular">{formatCount(profiles.length)}</span>{' '}
            {profiles.length === 1 ? 'profile' : 'profiles'}
          </p>
        }
        actions={
          <>
            <Button asChild data-testid="profile-button-add">
              <Link href={ROUTES.profiles.new}>
                <Plus aria-hidden="true" />
                Add profile
              </Link>
            </Button>
            <Button
              variant="outline"
              data-testid="profile-button-edit"
              disabled={!selectedId}
              onClick={handleEdit}
            >
              <Pencil aria-hidden="true" />
              Edit
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              data-testid="profile-button-delete"
              disabled={selectedRows.length === 0 || isDeleting || hasSystemSelected}
              onClick={() => setPendingDeleteIds(selectedRows.map((row) => row.original.id))}
            >
              <Trash2 aria-hidden="true" />
              Delete
            </Button>
          </>
        }
      />

      <div className="mb-4">
        <ToolbarList
          table={table}
          testIdPrefix={TESTID_PREFIX}
          onExport={() => {
            setExportNonce((nonce) => nonce + 1);
            setExportOpen(true);
          }}
          onCustomize={() => setCustomizeOpen(true)}
          onOpenFilters={() => setFiltersOpen(true)}
          activeFilterCount={table.getState().columnFilters.length}
        />
      </div>

      <div
        className="overflow-hidden rounded-lg border border-border bg-card shadow-card"
        data-testid={`${TESTID_PREFIX}-table-card`}
      >
        <DataTable
          table={table}
          testIdPrefix={TESTID_PREFIX}
          rowActions={getRowActions}
          emptyState={{
            title: 'No profiles yet',
            description: 'Profiles group permissions — create one and link it to an account.',
            action: (
              <Button asChild data-testid="profile-empty-button-add">
                <Link href={ROUTES.profiles.new}>
                  <Plus aria-hidden="true" />
                  Add the first profile
                </Link>
              </Button>
            ),
          }}
        />
        <Pagination table={table} testIdPrefix={TESTID_PREFIX} />
      </div>

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
                ? `Delete ${pendingDeleteIds?.length} profiles?`
                : 'Delete this profile?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Accounts linked to {isMultiDelete ? 'them lose' : 'it loses'} whatever permissions{' '}
              {isMultiDelete ? 'they' : 'it'} granted. There is no undo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="profile-delete-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="profile-delete-confirm"
              onClick={handleConfirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
