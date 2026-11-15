'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { GridColumnPreferenceDto, GridColumnPreferenceItem } from '@oliveira/schemas';
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
import { PageHeader } from '@/components/layout/page-header';
import type { ActionResult } from '@/lib/actions';
import { translateApiMessage } from '@/lib/i18n/api-messages';
import { useT } from '@/lib/i18n/provider';
import type { MessageKey } from '@/lib/i18n/translate';
import type { FilterableColumn } from '@/lib/list-query';
import { DataTable } from './data-table';
import { ExportModal, type ExportColumn } from './export-modal';
import { FilterDrawer, type FilterDrawerField } from './filter-drawer';
import { GridCustomizationModal, type CustomizableColumn } from './grid-customization-modal';
import { Pagination } from './pagination';
import { ToolbarList } from './toolbar-list';
import { useDataTable } from './use-data-table';
import { useListingScreen } from './use-listing-screen';
import { useListNavigation } from './use-list-navigation';

/**
 * The words of one record's listing, under one catalogue prefix — e.g.
 * `fsm.customers.list` holds `title`, `meta`, `metaSelected`, `add`,
 * `addFirst`, `searchPlaceholder`, `empty.title`, `empty.body`,
 * `deleteDialog.titleOne`, `deleteDialog.titleMany` and `deleteDialog.body`.
 */
export type ListMessagesPrefix = string;

export interface EntityListProps<TRow extends { id: string }> {
  rows: TRow[];
  total: number;
  columns: ColumnDef<TRow>[];
  filterableColumns: FilterableColumn[];
  filterFields: FilterDrawerField[];
  customizableColumns: CustomizableColumn[];
  exportColumns: ExportColumn<TRow>[];
  gridPreference: GridColumnPreferenceDto | null;
  saveGridPreferenceAction: (columns: GridColumnPreferenceItem[]) => Promise<ActionResult>;
  deleteAction: (ids: string[]) => Promise<ActionResult>;
  messages: ListMessagesPrefix;
  testIdPrefix: string;
  exportFileName: string;
  routes: { new: string; view: (id: string) => string; edit: (id: string) => string };
  can: { create: boolean; edit: boolean; delete: boolean };
  getRowLabel: (row: TRow) => string;
  /** Above the toolbar: tabs that are shortcuts to a filter, say. */
  beforeToolbar?: React.ReactNode;
}

/**
 * A record's listing in the shape every registry screen shares
 * (`docs/design/patterns/listing_pages.md`): Add, Edit and Delete in the
 * header — Edit and Delete act on the selection —, a double click (or Enter)
 * opens the record, the toolbar searches, filters, exports and customizes the
 * columns, and the URL holds the page, the sort and the filters. A routine
 * supplies its columns, its words and its actions; nothing else.
 */
export function EntityList<TRow extends { id: string }>({
  rows,
  total,
  columns,
  filterableColumns,
  filterFields,
  customizableColumns,
  exportColumns,
  gridPreference,
  saveGridPreferenceAction,
  deleteAction,
  messages,
  testIdPrefix,
  exportFileName,
  routes,
  can,
  getRowLabel,
  beforeToolbar,
}: EntityListProps<TRow>) {
  const t = useT();
  const m = (key: string, vars?: Record<string, string | number>) =>
    t(`${messages}.${key}` as MessageKey, vars);
  const router = useRouter();
  const { query, setQuery } = useListNavigation(filterableColumns);
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
  } = useListingScreen({ gridPreference, customizableColumns, saveGridPreferenceAction });

  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    rowCount: total,
    query,
    onQueryChange: setQuery,
    initialColumnVisibility,
    initialColumnOrder,
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedId = selectedRows.length === 1 ? selectedRows[0]!.original.id : undefined;
  const deleteCount = pendingDeleteIds?.length ?? 0;

  function handleConfirmDelete() {
    if (!pendingDeleteIds) {
      return;
    }

    startDeleting(async () => {
      const result = await deleteAction(pendingDeleteIds);
      const message = translateApiMessage(result.message ?? '', t);

      if (!result.success) {
        toast.error(message);
        setPendingDeleteIds(null);
        return;
      }

      toast.success(message);
      table.resetRowSelection();
      setPendingDeleteIds(null);
      router.refresh();
    });
  }

  return (
    <div data-testid={`${testIdPrefix}-container`}>
      <PageHeader
        title={m('title')}
        titleTestId={`${testIdPrefix}-title`}
        meta={
          selectedRows.length > 0
            ? m('metaSelected', { count: total, selected: selectedRows.length })
            : m('meta', { count: total })
        }
        actions={
          <>
            {can.delete ? (
              <Button
                variant="destructive-soft"
                data-testid={`${testIdPrefix}-button-delete`}
                disabled={selectedRows.length === 0 || isDeleting}
                onClick={() => setPendingDeleteIds(selectedRows.map((row) => row.original.id))}
              >
                <Trash2 aria-hidden="true" />
                {t('common.delete')}
              </Button>
            ) : null}
            {can.edit ? (
              <Button
                variant="edit"
                data-testid={`${testIdPrefix}-button-edit`}
                disabled={!selectedId}
                onClick={() => selectedId && router.push(routes.edit(selectedId))}
              >
                <Pencil aria-hidden="true" />
                {t('common.edit')}
              </Button>
            ) : null}
            {can.create ? (
              <Button asChild variant="create" data-testid={`${testIdPrefix}-button-add`}>
                <Link href={routes.new}>
                  <Plus aria-hidden="true" />
                  {m('add')}
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      {beforeToolbar}

      <div className="mb-4">
        <ToolbarList
          table={table}
          testIdPrefix={testIdPrefix}
          onExport={openExport}
          onCustomize={() => setCustomizeOpen(true)}
          onOpenFilters={() => setFiltersOpen(true)}
          activeFilterCount={
            table
              .getState()
              .columnFilters.filter((filter) =>
                table.getAllLeafColumns().some((column) => column.id === filter.id),
              ).length
          }
          filterFields={filterFields}
          searchPlaceholder={m('searchPlaceholder')}
        />
      </div>

      <div
        className="overflow-hidden rounded-xl border border-border bg-surface"
        data-testid={`${testIdPrefix}-table-card`}
      >
        <DataTable
          table={table}
          testIdPrefix={testIdPrefix}
          onRowOpen={(row) => router.push(routes.view(row.id))}
          getRowLabel={getRowLabel}
          emptyState={{
            title: m('empty.title'),
            description: m('empty.body'),
            action: can.create ? (
              <Button asChild variant="create" data-testid={`${testIdPrefix}-empty-button-add`}>
                <Link href={routes.new}>
                  <Plus aria-hidden="true" />
                  {m('addFirst')}
                </Link>
              </Button>
            ) : undefined,
          }}
        />
      </div>
      <Pagination table={table} testIdPrefix={testIdPrefix} />

      <FilterDrawer
        table={table}
        fields={filterFields}
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        testIdPrefix={testIdPrefix}
      />

      <GridCustomizationModal
        table={table}
        columns={customizableColumns}
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
        onSave={handleSaveGridPreference}
        testIdPrefix={testIdPrefix}
      />

      <ExportModal
        key={exportNonce}
        table={table}
        columns={exportColumns}
        open={exportOpen}
        onOpenChange={setExportOpen}
        fileName={exportFileName}
        testIdPrefix={testIdPrefix}
      />

      <AlertDialog
        open={pendingDeleteIds !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeleteIds(null);
          }
        }}
      >
        <AlertDialogContent data-testid={`${testIdPrefix}-delete-dialog`}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteCount > 1
                ? m('deleteDialog.titleMany', { count: deleteCount })
                : m('deleteDialog.titleOne')}
            </AlertDialogTitle>
            <AlertDialogDescription>{m('deleteDialog.body')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="ghost" data-testid={`${testIdPrefix}-delete-cancel`}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              data-testid={`${testIdPrefix}-delete-confirm`}
              onClick={handleConfirmDelete}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
