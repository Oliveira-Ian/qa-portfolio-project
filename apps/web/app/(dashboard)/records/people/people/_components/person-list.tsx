'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { GridColumnPreferenceDto, GridColumnPreferenceItem, Person } from '@oliveira/schemas';
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
import { deletePersonsAction } from '../_actions/delete-persons';
import { savePersonGridPreferenceAction } from '../_actions/save-grid-preferences';
import {
  PERSON_CUSTOMIZABLE_COLUMNS,
  PERSON_DEFAULT_VISIBLE_KEYS,
  PERSON_EXPORT_COLUMNS,
  personColumns,
} from './person-columns';
import { PERSON_FILTER_FIELDS } from './person-filter-fields';

const TESTID_PREFIX = 'person-list';

interface PersonListProps {
  people: Person[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  gridPreference: GridColumnPreferenceDto | null;
}

/**
 * Now a thin composition of `components/data-table/`'s shared listing
 * infrastructure — the toolbar, grid, filters, export, column
 * personalization and pagination are all generic; this file only supplies
 * Person's own columns, filter fields, row actions and the Add/Edit/Delete
 * permission gating.
 *
 * Per `docs/especificacoes/levantamento_cadastro_pessoa.md`: clicking a row
 * only selects it (no row link, no double-click-to-view); selection is a
 * free multi-select (Edit needs exactly one, Delete needs one or more); and
 * View/Edit/Delete live in each row's own action menu, not the row.
 */
export function PersonList({
  people,
  canCreate,
  canEdit,
  canDelete,
  gridPreference,
}: PersonListProps) {
  const router = useRouter();
  const [isDeleting, startDeleting] = useTransition();
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[] | null>(null);
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
      PERSON_CUSTOMIZABLE_COLUMNS.map((column) => [
        column.key,
        PERSON_DEFAULT_VISIBLE_KEYS.has(column.key),
      ]),
    );
  }, [gridPreference]);

  const initialColumnOrder = useMemo(() => {
    const savedOrder = gridPreference?.columns.map((column) => column.key);
    const dataColumnOrder = savedOrder ?? PERSON_CUSTOMIZABLE_COLUMNS.map((column) => column.key);
    return [...dataColumnOrder, 'actions'];
  }, [gridPreference]);

  // Shared by the "⋮" column cell and `DataTable`'s `rowActions` (right-click
  // menu) — declared once so both paths always show the identical list.
  const getRowActions = useCallback(
    (person: Person): RowAction[] => {
      const actions: RowAction[] = [
        {
          key: 'view',
          label: 'View',
          icon: Eye,
          onSelect: () => router.push(ROUTES.people.view(person.id)),
          testId: `${TESTID_PREFIX}-row-action-view`,
        },
      ];

      if (canEdit) {
        actions.push({
          key: 'edit',
          label: 'Edit',
          icon: Pencil,
          onSelect: () => router.push(ROUTES.people.edit(person.id)),
          testId: `${TESTID_PREFIX}-row-action-edit`,
        });
      }

      if (canDelete) {
        actions.push({
          key: 'delete',
          label: 'Delete',
          icon: Trash2,
          variant: 'destructive',
          onSelect: () => setPendingDeleteIds([person.id]),
          testId: `${TESTID_PREFIX}-row-action-delete`,
        });
      }

      return actions;
    },
    [router, canEdit, canDelete],
  );

  const columns = useMemo<ColumnDef<Person>[]>(
    () => [
      ...personColumns,
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
    data: people,
    columns,
    getRowId: (person) => person.id,
    initialColumnVisibility,
    initialColumnOrder,
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedId = selectedRows.length === 1 ? selectedRows[0]!.original.id : undefined;
  const isMultiDelete = (pendingDeleteIds?.length ?? 0) > 1;

  function handleEdit() {
    if (selectedId) {
      router.push(ROUTES.people.edit(selectedId));
    }
  }

  function handleConfirmDelete() {
    if (!pendingDeleteIds) {
      return;
    }

    startDeleting(async () => {
      const result = await deletePersonsAction(pendingDeleteIds);

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
    const result = await savePersonGridPreferenceAction(preferenceColumns);

    if (!result.success) {
      toast.error(result.message ?? 'Could not save your column preferences');
      return;
    }

    toast.success('Column preferences saved');
  }

  return (
    <div data-testid={`${TESTID_PREFIX}-container`}>
      <PageHeader
        eyebrow="Records"
        title="People"
        titleTestId={`${TESTID_PREFIX}-title`}
        meta={
          <p className="eyebrow mt-3 text-muted-foreground">
            <span className="tabular">{formatCount(people.length)}</span>{' '}
            {people.length === 1 ? 'record' : 'records'}
          </p>
        }
        actions={
          <>
            {canCreate ? (
              <Button asChild data-testid={`${TESTID_PREFIX}-button-add`}>
                <Link href={ROUTES.people.new}>
                  <Plus aria-hidden="true" />
                  Add person
                </Link>
              </Button>
            ) : null}
            {canEdit ? (
              <Button
                variant="outline"
                data-testid={`${TESTID_PREFIX}-button-edit`}
                disabled={!selectedId}
                onClick={handleEdit}
              >
                <Pencil aria-hidden="true" />
                Edit
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                variant="outline"
                className="text-destructive hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                data-testid={`${TESTID_PREFIX}-button-delete`}
                disabled={selectedRows.length === 0 || isDeleting}
                onClick={() => setPendingDeleteIds(selectedRows.map((row) => row.original.id))}
              >
                <Trash2 aria-hidden="true" />
                Delete
              </Button>
            ) : null}
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
            title: 'The registry is empty',
            description:
              'Clients and suppliers you add here become available to every other part of the system.',
            action: canCreate ? (
              <Button asChild data-testid={`${TESTID_PREFIX}-empty-button-add`}>
                <Link href={ROUTES.people.new}>
                  <Plus aria-hidden="true" />
                  Add the first person
                </Link>
              </Button>
            ) : undefined,
          }}
        />
        <Pagination table={table} testIdPrefix={TESTID_PREFIX} />
      </div>

      <FilterDrawer
        table={table}
        fields={PERSON_FILTER_FIELDS}
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        testIdPrefix={TESTID_PREFIX}
      />

      <GridCustomizationModal
        table={table}
        columns={PERSON_CUSTOMIZABLE_COLUMNS}
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
        onSave={handleSaveGridPreference}
        testIdPrefix={TESTID_PREFIX}
      />

      <ExportModal
        key={exportNonce}
        table={table}
        columns={PERSON_EXPORT_COLUMNS}
        open={exportOpen}
        onOpenChange={setExportOpen}
        fileName="people"
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
        <AlertDialogContent data-testid={`${TESTID_PREFIX}-delete-dialog`}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isMultiDelete ? `Delete ${pendingDeleteIds?.length} people?` : 'Delete this person?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isMultiDelete
                ? 'The records and everything on them are removed for good. There is no undo.'
                : 'The record and everything on it are removed for good. There is no undo.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid={`${TESTID_PREFIX}-delete-cancel`}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid={`${TESTID_PREFIX}-delete-confirm`}
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
