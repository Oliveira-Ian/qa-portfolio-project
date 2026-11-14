'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { CatalogItemDto, CatalogItemKind, GridColumnPreferenceDto } from '@oliveira/schemas';
import {
  ActiveBadge,
  DateCell,
  MonoCell,
  NameCell,
  columnHeader,
  customizableColumns,
} from '@/components/data-table/column-kit';
import { filterableColumn } from '@/components/data-table/column-helpers';
import { EntityList } from '@/components/data-table/entity-list';
import type { ExportColumn } from '@/components/data-table/export-modal';
import { useListNavigation } from '@/components/data-table/use-list-navigation';
import { StatusBadge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDateMedium } from '@/lib/format';
import { useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import {
  deleteCatalogItemsAction,
  saveCatalogItemGridAction,
} from '../_actions/catalog-item-actions';
import {
  CATALOG_ITEM_FILTERABLE_COLUMNS,
  CATALOG_ITEM_FILTER_FIELDS,
  CATALOG_ITEM_KIND_OPTIONS,
} from './catalog-item-filters';

const PREFIX = 'catalog-item-list';
const header = (key: Parameters<typeof columnHeader>[0]) =>
  columnHeader<CatalogItemDto>(key, PREFIX);

function KindBadge({ kind }: { kind: CatalogItemKind }) {
  const t = useT();

  return (
    <StatusBadge tone={kind === 'PRODUCT' ? 'info' : 'neutral'}>
      {t(`fsm.catalogItems.kind.${kind}`)}
    </StatusBadge>
  );
}

const columns: ColumnDef<CatalogItemDto>[] = [
  {
    accessorKey: 'code',
    header: header('fsm.columns.code'),
    cell: ({ getValue }) => <MonoCell value={getValue<string | null>()} />,
    ...filterableColumn<CatalogItemDto>('text', undefined, 'fsm.columns.code'),
  },
  {
    accessorKey: 'name',
    header: header('fsm.columns.name'),
    cell: ({ row }) => <NameCell value={row.original.name} sub={row.original.description} />,
    ...filterableColumn<CatalogItemDto>('text', undefined, 'fsm.columns.name'),
  },
  {
    accessorKey: 'kind',
    header: header('fsm.columns.kind'),
    cell: ({ getValue }) => <KindBadge kind={getValue<CatalogItemKind>()} />,
    ...filterableColumn<CatalogItemDto>('enum', CATALOG_ITEM_KIND_OPTIONS, 'fsm.columns.kind'),
  },
  {
    accessorKey: 'unit',
    header: header('fsm.columns.unit'),
    cell: ({ getValue }) => <MonoCell value={getValue<string>()} />,
    ...filterableColumn<CatalogItemDto>('text', undefined, 'fsm.columns.unit'),
  },
  {
    accessorKey: 'price',
    header: header('fsm.columns.price'),
    cell: ({ getValue }) => {
      const price = getValue<string | null>();

      return <MonoCell value={price === null ? null : formatCurrency(Number(price))} />;
    },
    enableColumnFilter: false,
  },
  {
    accessorKey: 'active',
    header: header('fsm.columns.status'),
    cell: ({ getValue }) => <ActiveBadge active={getValue<boolean>()} />,
    ...filterableColumn<CatalogItemDto>('boolean', undefined, 'fsm.columns.status'),
  },
  {
    accessorKey: 'createdAt',
    header: header('fsm.columns.created'),
    cell: ({ getValue }) => <DateCell value={getValue<string>()} />,
    ...filterableColumn<CatalogItemDto>('date', undefined, 'fsm.columns.created'),
  },
];

const exportColumns: ExportColumn<CatalogItemDto>[] = [
  { key: 'code', labelKey: 'fsm.columns.code', getValue: (row) => row.code ?? '' },
  { key: 'name', labelKey: 'fsm.columns.name', getValue: (row) => row.name },
  {
    key: 'kind',
    labelKey: 'fsm.columns.kind',
    getValue: (row, { t }) => t(`fsm.catalogItems.kind.${row.kind}`),
  },
  { key: 'unit', labelKey: 'fsm.columns.unit', getValue: (row) => row.unit },
  { key: 'price', labelKey: 'fsm.columns.price', getValue: (row) => row.price ?? '' },
  {
    key: 'active',
    labelKey: 'fsm.columns.status',
    getValue: (row, { t }) => t(row.active ? 'common.active' : 'common.inactive'),
  },
  {
    key: 'createdAt',
    labelKey: 'fsm.columns.created',
    getValue: (row, { locale }) => formatDateMedium(row.createdAt, locale),
  },
];

const CUSTOMIZABLE = customizableColumns(exportColumns, [
  'code',
  'name',
  'kind',
  'unit',
  'price',
  'active',
]);

type KindTab = 'all' | 'PRODUCT' | 'SERVICE' | 'custom';

/** All / Products / Services: a shortcut to the Kind filter, written into the URL like the drawer's. */
function KindTabs() {
  const t = useT();
  const { query, setQuery } = useListNavigation(CATALOG_ITEM_FILTERABLE_COLUMNS);
  const kinds = query.filters.find((filter) => filter.id === 'kind')?.value as string[] | undefined;
  const active: KindTab =
    !kinds || kinds.length === 0
      ? 'all'
      : kinds.length === 1 && (kinds[0] === 'PRODUCT' || kinds[0] === 'SERVICE')
        ? kinds[0]
        : 'custom';

  function handleChange(tab: string) {
    const others = query.filters.filter((filter) => filter.id !== 'kind');

    setQuery({
      filters: tab === 'all' ? others : [...others, { id: 'kind', value: [tab] }],
      page: 1,
    });
  }

  return (
    <Tabs value={active} onValueChange={handleChange} className="mb-5">
      <TabsList aria-label={t('fsm.catalogItems.list.tabs.label')} data-testid={`${PREFIX}-tabs`}>
        <TabsTrigger value="all" aria-controls={undefined} data-testid={`${PREFIX}-tab-all`}>
          {t('fsm.catalogItems.list.tabs.all')}
        </TabsTrigger>
        <TabsTrigger
          value="PRODUCT"
          aria-controls={undefined}
          data-testid={`${PREFIX}-tab-products`}
        >
          {t('fsm.catalogItems.list.tabs.products')}
        </TabsTrigger>
        <TabsTrigger
          value="SERVICE"
          aria-controls={undefined}
          data-testid={`${PREFIX}-tab-services`}
        >
          {t('fsm.catalogItems.list.tabs.services')}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

interface CatalogItemListProps {
  rows: CatalogItemDto[];
  total: number;
  can: { create: boolean; edit: boolean; delete: boolean };
  gridPreference: GridColumnPreferenceDto | null;
}

export function CatalogItemList({ rows, total, can, gridPreference }: CatalogItemListProps) {
  return (
    <EntityList
      rows={rows}
      total={total}
      columns={columns}
      filterableColumns={CATALOG_ITEM_FILTERABLE_COLUMNS}
      filterFields={CATALOG_ITEM_FILTER_FIELDS}
      customizableColumns={CUSTOMIZABLE}
      exportColumns={exportColumns}
      gridPreference={gridPreference}
      saveGridPreferenceAction={saveCatalogItemGridAction}
      deleteAction={deleteCatalogItemsAction}
      messages="fsm.catalogItems.list"
      testIdPrefix={PREFIX}
      exportFileName="products-services"
      routes={ROUTES.fsm.catalogItems}
      can={can}
      getRowLabel={(row) => row.name}
      beforeToolbar={<KindTabs />}
    />
  );
}
