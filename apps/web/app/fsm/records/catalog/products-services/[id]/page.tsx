import type { Metadata } from 'next';
import { NoPermission } from '@/components/platform/no-permission';
import { can } from '@/lib/permissions';
import { CatalogItemForm } from '../_components/catalog-item-form';
import { catalogItemAccess } from '../_data-access/catalog-item-access';

interface CatalogItemPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CatalogItemPageProps): Promise<Metadata> {
  if (!(await can('FSM', 'catalog-item:view'))) {
    return {};
  }

  return { title: (await catalogItemAccess.get((await params).id)).name };
}

export default async function CatalogItemPage({ params }: CatalogItemPageProps) {
  if (!(await can('FSM', 'catalog-item:view'))) {
    return <NoPermission product="FSM" screen="nav.fsm.productsServices" />;
  }

  const [item, canEdit] = await Promise.all([
    catalogItemAccess.get((await params).id),
    can('FSM', 'catalog-item:edit'),
  ]);

  return <CatalogItemForm mode="view" item={item} canEdit={canEdit} />;
}
