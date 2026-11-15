'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { GridColumnPreferenceDto, Person } from '@oliveira/schemas';
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
import { Tabs, TabsCount, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { translateApiMessage } from '@/lib/i18n/api-messages';
import { useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import { deletePersonsAction } from '../_actions/delete-persons';
import { savePersonGridPreferenceAction } from '../_actions/save-grid-preferences';
import {
  PERSON_CUSTOMIZABLE_COLUMNS,
  PERSON_EXPORT_COLUMNS,
  personColumns,
} from './person-columns';
import { PERSON_FILTER_FIELDS, PERSON_FILTERABLE_COLUMNS } from './person-filter-fields';

const TESTID_PREFIX = 'person-list';

type PersonTab = 'all' | 'clients' | 'suppliers' | 'custom';

const TAB_TYPE: Record<'clients' | 'suppliers', string> = {
  clients: 'CLIENT',
  suppliers: 'SUPPLIER',
};

interface PersonListProps {
  people: Person[];
  /** Total rows across every page — `people.length` is just the current page's. */
  total: number;
  /** The registry's own counts (not the filtered ones) — what the tabs say. */
  counts: { total: number; clients: number; suppliers: number };
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
 *
 * The All / Clients / Suppliers tabs (design S14) are a shortcut to the `Type`
 * filter, not a second mechanism: choosing one writes `f_types` into the URL like
 * the drawer would, and any other combination of types shows no tab selected.
 */
export function PersonList({
  people,
  total,
  counts,
  canCreate,
  canEdit,
  canDelete,
  gridPreference,
}: PersonListProps) {
  const t = useT();
  const router = useRouter();
  const { query, setQuery } = useListNavigation(PERSON_FILTERABLE_COLUMNS);
  const [isDeleting, startDeleting] = useTransition();
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[] | null>(null);
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
    customizableColumns: PERSON_CUSTOMIZABLE_COLUMNS,
    saveGridPreferenceAction: savePersonGridPreferenceAction,
  });

  // Shared by the "⋮" column cell and `DataTable`'s `rowActions` (right-click
  // menu) — declared once so both paths always show the identical list.
  const getRowActions = useCallback(
    (person: Person): RowAction[] => {
      const actions: RowAction[] = [
        {
          key: 'view',
          label: t('erp.people.view'),
          icon: Eye,
          onSelect: () => router.push(ROUTES.people.view(person.id)),
          testId: `${TESTID_PREFIX}-row-action-view`,
        },
      ];

      if (canEdit) {
        actions.push({
          key: 'edit',
          label: t('erp.people.edit'),
          icon: Pencil,
          onSelect: () => router.push(ROUTES.people.edit(person.id)),
          testId: `${TESTID_PREFIX}-row-action-edit`,
        });
      }

      if (canDelete) {
        actions.push({
          key: 'delete',
          label: t('erp.people.delete'),
          icon: Trash2,
          variant: 'destructive',
          onSelect: () => setPendingDeleteIds([person.id]),
          testId: `${TESTID_PREFIX}-row-action-delete`,
        });
      }

      return actions;
    },
    [router, canEdit, canDelete, t],
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
    rowCount: total,
    query,
    onQueryChange: setQuery,
    initialColumnVisibility,
    initialColumnOrder,
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedId = selectedRows.length === 1 ? selectedRows[0]!.original.id : undefined;
  const isMultiDelete = (pendingDeleteIds?.length ?? 0) > 1;

  const typesFilter = query.filters.find((filter) => filter.id === 'types')?.value as
    string[] | undefined;
  const activeTab: PersonTab =
    !typesFilter || typesFilter.length === 0
      ? 'all'
      : typesFilter.length === 1 && typesFilter[0] === TAB_TYPE.clients
        ? 'clients'
        : typesFilter.length === 1 && typesFilter[0] === TAB_TYPE.suppliers
          ? 'suppliers'
          : 'custom';

  function handleTabChange(tab: string) {
    const others = query.filters.filter((filter) => filter.id !== 'types');

    setQuery({
      filters:
        tab === 'clients' || tab === 'suppliers'
          ? [...others, { id: 'types', value: [TAB_TYPE[tab]] }]
          : others,
      page: 1,
    });
  }

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

  const meta =
    selectedRows.length > 0
      ? t('erp.people.metaSelected', { count: total, selected: selectedRows.length })
      : t('erp.people.meta', { count: total });

  return (
    <div data-testid={`${TESTID_PREFIX}-container`}>
      <PageHeader
        title={t('erp.people.title')}
        titleTestId={`${TESTID_PREFIX}-title`}
        meta={meta}
        actions={
          <>
            {canDelete ? (
              <Button
                variant="destructive-soft"
                data-testid={`${TESTID_PREFIX}-button-delete`}
                disabled={selectedRows.length === 0 || isDeleting}
                onClick={() => setPendingDeleteIds(selectedRows.map((row) => row.original.id))}
              >
                <Trash2 aria-hidden="true" />
                {t('erp.people.delete')}
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
                {t('erp.people.edit')}
              </Button>
            ) : null}
            {canCreate ? (
              <Button asChild data-testid={`${TESTID_PREFIX}-button-add`}>
                <Link href={ROUTES.people.new}>
                  <Plus aria-hidden="true" />
                  {t('erp.people.add')}
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-5">
        <TabsList aria-label={t('erp.people.tabs.label')} data-testid={`${TESTID_PREFIX}-tabs`}>
          <TabsTrigger
            value="all"
            aria-controls={undefined}
            data-testid={`${TESTID_PREFIX}-tab-all`}
          >
            {t('erp.people.tabs.all')}
            <TabsCount>{counts.total}</TabsCount>
          </TabsTrigger>
          <TabsTrigger
            value="clients"
            aria-controls={undefined}
            data-testid={`${TESTID_PREFIX}-tab-clients`}
          >
            {t('erp.people.tabs.clients')}
            <TabsCount>{counts.clients}</TabsCount>
          </TabsTrigger>
          <TabsTrigger
            value="suppliers"
            aria-controls={undefined}
            data-testid={`${TESTID_PREFIX}-tab-suppliers`}
          >
            {t('erp.people.tabs.suppliers')}
            <TabsCount>{counts.suppliers}</TabsCount>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mb-4">
        <ToolbarList
          table={table}
          testIdPrefix={TESTID_PREFIX}
          onExport={openExport}
          onCustomize={() => setCustomizeOpen(true)}
          onOpenFilters={() => setFiltersOpen(true)}
          activeFilterCount={table.getState().columnFilters.length}
          filterFields={PERSON_FILTER_FIELDS}
          searchPlaceholder={t('erp.people.searchPlaceholder')}
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
          getRowLabel={(person) => person.name}
          emptyState={{
            title: t('erp.people.empty.title'),
            description: t('erp.people.empty.body'),
            action: canCreate ? (
              <Button asChild data-testid={`${TESTID_PREFIX}-empty-button-add`}>
                <Link href={ROUTES.people.new}>
                  <Plus aria-hidden="true" />
                  {t('erp.people.addFirst')}
                </Link>
              </Button>
            ) : undefined,
          }}
        />
      </div>
      <Pagination table={table} testIdPrefix={TESTID_PREFIX} />

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
              {isMultiDelete
                ? t('erp.people.deleteDialog.titleMany', { count: pendingDeleteIds?.length ?? 0 })
                : t('erp.people.deleteDialog.titleOne')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isMultiDelete
                ? t('erp.people.deleteDialog.bodyMany')
                : t('erp.people.deleteDialog.bodyOne')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="ghost" data-testid={`${TESTID_PREFIX}-delete-cancel`}>
              {t('erp.people.deleteDialog.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              data-testid={`${TESTID_PREFIX}-delete-confirm`}
              onClick={handleConfirmDelete}
            >
              {t('erp.people.deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
