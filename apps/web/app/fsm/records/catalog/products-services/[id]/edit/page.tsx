import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/navigation/routes';
import { can } from '@/lib/permissions';
import { CatalogItemForm } from '../../_components/catalog-item-form';
import { catalogItemAccess } from '../../_data-access/catalog-item-access';

interface EditCatalogItemPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditCatalogItemPageProps): Promise<Metadata> {
  if (!(await can('FSM', 'catalog-item:edit'))) {
    return {};
  }

  return { title: (await catalogItemAccess.get((await params).id)).name };
}

export default async function EditCatalogItemPage({ params }: EditCatalogItemPageProps) {
  const { id } = await params;

  if (!(await can('FSM', 'catalog-item:edit'))) {
    redirect(ROUTES.fsm.catalogItems.view(id));
  }

  return <CatalogItemForm mode="edit" item={await catalogItemAccess.get(id)} />;
}
