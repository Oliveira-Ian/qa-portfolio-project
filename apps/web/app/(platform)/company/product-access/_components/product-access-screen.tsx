import { notFound, redirect } from 'next/navigation';
import { PRODUCTS, productSchema, type Product } from '@oliveira/schemas';
import { ROUTES } from '@/lib/navigation/routes';
import { getMe } from '@/lib/permissions';
import { PRODUCT_AVAILABILITY } from '@/lib/products';
import { getCompanyMembers } from '../../_data-access/get-company-members';
import { ProductAccessEditor } from './product-access-editor';

/** The first product that can be opened — the default tab (handoff § 9a). */
const DEFAULT_PRODUCT: Product =
  PRODUCTS.find((product) => PRODUCT_AVAILABILITY[product].available) ?? 'ERP';

/**
 * `/company/product-access/:product?` — the tab is the URL's. A product the
 * Platform doesn't have is a 404; one that exists but isn't available yet (the
 * FSM, a placeholder) lands on the default tab instead, since there is nothing to
 * grant there.
 */
export async function ProductAccessScreen({ requested }: { requested?: string | undefined }) {
  const me = await getMe();

  if (!me.membership) {
    notFound();
  }

  let product = DEFAULT_PRODUCT;

  if (requested !== undefined) {
    const parsed = productSchema.safeParse(requested.toUpperCase());

    if (!parsed.success) {
      notFound();
    }

    if (!PRODUCT_AVAILABILITY[parsed.data].available) {
      redirect(ROUTES.company.productAccess(DEFAULT_PRODUCT));
    }

    product = parsed.data;
  }

  const company = await getCompanyMembers();
  const snapshot = company.members
    .map((member) => `${member.id}${member.status}${member.products.join('')}`)
    .join('|');

  return (
    // A saved change comes back as new data: remount so the switches show the server's truth.
    <ProductAccessEditor key={`${product}:${snapshot}`} company={company} product={product} />
  );
}
