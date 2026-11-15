import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';
import { PRODUCT_LABELS, type MeMembership, type Product } from '@oliveira/schemas';
import { Button } from '@/components/ui/button';
import { getTranslator } from '@/lib/i18n/server';
import { ROUTES } from '@/lib/navigation/routes';

interface NoProductAccessProps {
  product: Product;
  membership: MeMembership | null;
}

/**
 * What a signed-in user sees at a product's URL when they have no seat in it
 * (design S07/S08): the global bar only, no product sidebar, and an explanation
 * — the account and the membership are fine, the product simply isn't enabled
 * for them, and a company admin grants it. It replaces `children` in the area's
 * layout, so the product's own pages are never rendered; the API refuses their
 * data regardless (`requireProductAccess`, docs/adr/0018) — this is the polite
 * half, not the boundary.
 *
 * The design also lists the company's admins here. The API exposes the member
 * list to admins only, so it isn't shown: naming whom to ask needs an endpoint
 * a plain member may read, which is a backend decision, not a UI one.
 */
export async function NoProductAccess({ product, membership }: NoProductAccessProps) {
  const t = await getTranslator();
  const productName = PRODUCT_LABELS[product];

  return (
    <div className="grid place-items-center py-10 md:py-20" data-testid="no-product-access">
      <div className="w-full max-w-[560px] rounded-xl border border-border bg-card p-6 shadow-card md:p-10">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-lg bg-subtle text-text-2">
            <Lock className="size-5" aria-hidden="true" />
          </span>
          <span className="olv-overline text-text-3">{t('guard.noAccess.overline')}</span>
        </div>

        <h1 className="mt-6 text-[28px] leading-[34px]" data-testid="no-product-access-title">
          {t('guard.noAccess.title', { product: productName })}
        </h1>

        <p className="mt-4 text-[15px] leading-[1.6] text-text-2">
          {membership
            ? t('guard.noAccess.withCompany', {
                company: membership.companyName,
                product: productName,
              })
            : t('guard.noAccess.noCompany', { product: productName })}
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          <Button asChild data-testid="no-product-access-home" data-product="platform">
            <Link href={ROUTES.home}>
              <ArrowLeft aria-hidden="true" />
              {t('guard.backToHome')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
