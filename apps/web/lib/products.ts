import { PRODUCT_LABELS, type Product } from '@oliveira/schemas';
import type { AreaKey } from '@/lib/navigation/nav';

/**
 * The names of the areas, as proper nouns — never translated, in any language
 * (design handoff § 1 and § 7). `PRODUCT_LABELS` (`@oliveira/schemas`) owns the
 * products' names; the Platform's own is here.
 */
export const PLATFORM_NAME = 'Oliveira Platform';

export function areaName(area: AreaKey): string {
  return area === 'platform' ? PLATFORM_NAME : PRODUCT_LABELS[area];
}

/** "Platform", "ERP", "FSM" — the part after "Oliveira", which the lockup sets in the accent. */
export function areaShortName(area: AreaKey): string {
  return areaName(area).replace(/^Oliveira\s+/, '');
}

/** The value of `data-product` that scopes the accent tokens (`oliveira-tokens.css`). */
export function areaScope(area: AreaKey): 'platform' | 'erp' | 'fsm' {
  return area === 'platform' ? 'platform' : area === 'ERP' ? 'erp' : 'fsm';
}

/**
 * What the web knows about each product beyond its name. `available` is false
 * for a product that is announced but not built: the FSM is a placeholder
 * ("coming soon"), so it cannot be opened, and its access cannot be granted
 * from the UI, even though the API would accept a seat for it.
 */
export const PRODUCT_AVAILABILITY: Record<Product, { available: boolean }> = {
  ERP: { available: true },
  FSM: { available: false },
};
