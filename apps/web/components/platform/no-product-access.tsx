import { PRODUCT_LABELS, type MeMembership, type Product } from '@oliveira/schemas';
import { EmptyState } from '@/components/ui/empty-state';

interface NoProductAccessProps {
  product: Product;
  membership: MeMembership | null;
}

/**
 * What a signed-in user sees instead of a product they have no seat in. The
 * product's own pages are never rendered — this replaces `children` in the
 * area's layout — and the API refuses their data regardless
 * (`requireProductAccess`, docs/adr/0018); this is only the polite half.
 */
export function NoProductAccess({ product, membership }: NoProductAccessProps) {
  const label = PRODUCT_LABELS[product];

  return (
    <div
      className="mt-8 rounded-lg border border-dashed border-border bg-card"
      data-testid="no-product-access"
    >
      <EmptyState
        title={`You don't have access to ${label}`}
        description={
          membership
            ? `Ask the administrator of ${membership.companyName} to grant you a seat in ${label}.`
            : `Your account isn't linked to a company yet. Ask a company administrator to add you, then to grant you a seat in ${label}.`
        }
      />
    </div>
  );
}
