import type { Metadata } from 'next';
import { NoPermission } from '@/components/platform/no-permission';
import { getTranslator } from '@/lib/i18n/server';
import { parseListQuery, toURLSearchParams } from '@/lib/list-query';
import { can } from '@/lib/permissions';
import { CatalogItemList } from './_components/catalog-item-list';
import { CATALOG_ITEM_FILTERABLE_COLUMNS } from './_components/catalog-item-filters';
import { catalogItemAccess, catalogItemGrid } from './_data-access/catalog-item-access';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('fsm.catalogItems.list.title') };
}

interface CatalogItemsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** The FSM's products and services — the URL holds the page, the sort and the filters. */
export default async function CatalogItemsPage({ searchParams }: CatalogItemsPageProps) {
  if (!(await can('FSM', 'catalog-item:view'))) {
    return <NoPermission product="FSM" screen="nav.fsm.productsServices" />;
  }

  const query = parseListQuery(
    toURLSearchParams(await searchParams),
    CATALOG_ITEM_FILTERABLE_COLUMNS,
  );
  const [result, gridPreference, canCreate, canEdit, canDelete] = await Promise.all([
    catalogItemAccess.list(query),
    catalogItemGrid.getPreference(),
    can('FSM', 'catalog-item:create'),
    can('FSM', 'catalog-item:edit'),
    can('FSM', 'catalog-item:delete'),
  ]);

  return (
    <CatalogItemList
      rows={result.items}
      total={result.total}
      can={{ create: canCreate, edit: canEdit, delete: canDelete }}
      gridPreference={gridPreference}
    />
  );
}
