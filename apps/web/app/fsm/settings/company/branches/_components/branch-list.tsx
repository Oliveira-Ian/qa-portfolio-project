'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Building2 } from 'lucide-react';
import type { BranchDto, GridColumnPreferenceDto } from '@oliveira/schemas';
import {
  ActiveBadge,
  MonoCell,
  NameCell,
  columnHeader,
  customizableColumns,
} from '@/components/data-table/column-kit';
import { filterableColumn } from '@/components/data-table/column-helpers';
import { EntityList } from '@/components/data-table/entity-list';
import type { ExportColumn } from '@/components/data-table/export-modal';
import { useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import { deleteBranchesAction, saveBranchGridAction } from '../_actions/branch-actions';
import type { FilterOption } from '@/components/data-table/types';
import { BRANCH_FILTERABLE_COLUMNS, branchFilterFields } from './branch-filters';

const PREFIX = 'branch-list';
const header = (key: Parameters<typeof columnHeader>[0]) => columnHeader<BranchDto>(key, PREFIX);

/** City filters from the cities the branches are in. */
function buildColumns(cities: FilterOption[]): ColumnDef<BranchDto>[] {
  return [
    {
      accessorKey: 'code',
      header: header('fsm.columns.code'),
      cell: ({ getValue }) => <MonoCell value={getValue<string>()} />,
      ...filterableColumn<BranchDto>('text', undefined, 'fsm.columns.code'),
    },
    {
      accessorKey: 'name',
      header: header('fsm.columns.name'),
      cell: ({ getValue }) => <NameCell value={getValue<string>()} />,
      ...filterableColumn<BranchDto>('text', undefined, 'fsm.columns.name'),
    },
    {
      accessorKey: 'document',
      header: header('fsm.columns.document'),
      cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
      ...filterableColumn<BranchDto>('text', undefined, 'fsm.columns.document'),
    },
    {
      id: 'city',
      accessorFn: (branch) => branch.address?.city ?? null,
      header: header('fsm.columns.city'),
      cell: ({ getValue }) => getValue<string | null>() ?? '—',
      enableSorting: false,
      ...filterableColumn<BranchDto>('enum', cities, 'fsm.columns.city'),
    },
    {
      id: 'state',
      accessorFn: (branch) => branch.address?.state ?? null,
      header: header('fsm.columns.state'),
      cell: ({ getValue }) => getValue<string | null>() ?? '—',
      enableSorting: false,
      ...filterableColumn<BranchDto>('text', undefined, 'fsm.columns.state'),
    },
    {
      accessorKey: 'phone',
      header: header('fsm.columns.phone'),
      cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
      enableSorting: false,
      ...filterableColumn<BranchDto>('text', undefined, 'fsm.columns.phone'),
    },
    {
      accessorKey: 'active',
      header: header('fsm.columns.status'),
      cell: ({ getValue }) => <ActiveBadge active={getValue<boolean>()} />,
      ...filterableColumn<BranchDto>('boolean', undefined, 'fsm.columns.status'),
    },
  ];
}

const exportColumns: ExportColumn<BranchDto>[] = [
  { key: 'code', labelKey: 'fsm.columns.code', getValue: (row) => row.code },
  { key: 'name', labelKey: 'fsm.columns.name', getValue: (row) => row.name },
  { key: 'document', labelKey: 'fsm.columns.document', getValue: (row) => row.document ?? '' },
  { key: 'city', labelKey: 'fsm.columns.city', getValue: (row) => row.address?.city ?? '' },
  { key: 'state', labelKey: 'fsm.columns.state', getValue: (row) => row.address?.state ?? '' },
  { key: 'phone', labelKey: 'fsm.columns.phone', getValue: (row) => row.phone ?? '' },
  {
    key: 'active',
    labelKey: 'fsm.columns.status',
    getValue: (row, { t }) => t(row.active ? 'common.active' : 'common.inactive'),
  },
];

const CUSTOMIZABLE = customizableColumns(exportColumns, [
  'code',
  'name',
  'city',
  'state',
  'active',
]);

/** The company the branches belong to — context only: its registration lives on the Platform. */
function CompanyContext({ companyName }: { companyName: string }) {
  const t = useT();

  return (
    <div
      className="mb-5 flex items-start gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3"
      data-testid={`${PREFIX}-company`}
    >
      <Building2 className="mt-0.5 size-4 shrink-0 text-text-3" aria-hidden="true" />
      <p className="text-sm text-text-2">
        <span className="font-medium text-foreground">
          {t('fsm.branches.list.company')}: {companyName}
        </span>
        <span className="block text-text-3">{t('fsm.branches.list.companyNote')}</span>
      </p>
    </div>
  );
}

interface BranchListProps {
  rows: BranchDto[];
  total: number;
  companyName: string;
  can: { create: boolean; edit: boolean; delete: boolean };
  gridPreference: GridColumnPreferenceDto | null;
  cities: FilterOption[];
}

export function BranchList({
  rows,
  total,
  companyName,
  can,
  gridPreference,
  cities,
}: BranchListProps) {
  const columns = useMemo(() => buildColumns(cities), [cities]);
  const filterFields = useMemo(() => branchFilterFields(cities), [cities]);

  return (
    <EntityList
      rows={rows}
      total={total}
      columns={columns}
      filterableColumns={BRANCH_FILTERABLE_COLUMNS}
      filterFields={filterFields}
      customizableColumns={CUSTOMIZABLE}
      exportColumns={exportColumns}
      gridPreference={gridPreference}
      saveGridPreferenceAction={saveBranchGridAction}
      deleteAction={deleteBranchesAction}
      messages="fsm.branches.list"
      testIdPrefix={PREFIX}
      exportFileName="branches"
      routes={ROUTES.fsm.branches}
      can={can}
      getRowLabel={(row) => row.name}
      beforeToolbar={<CompanyContext companyName={companyName} />}
    />
  );
}
