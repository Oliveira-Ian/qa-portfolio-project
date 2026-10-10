import type { Metadata } from 'next';
import { CompanyAdminGate } from '@/components/platform/company-admin-gate';
import { getTranslator } from '@/lib/i18n/server';
import { ProductAccessScreen } from '../_components/product-access-screen';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('company.access.title') };
}

export default async function ProductAccessPage({
  params,
}: {
  params: Promise<{ product?: string[] }>;
}) {
  const { product } = await params;

  return (
    <CompanyAdminGate>
      <ProductAccessScreen requested={product?.[0]} />
    </CompanyAdminGate>
  );
}
