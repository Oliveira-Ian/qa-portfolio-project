import type { Product } from '@oliveira/schemas';

/**
 * Options of a route plugin that serves the same resource for more than one
 * product — the product's profiles, its permission catalog, its members' profile
 * links. The product is fixed where the plugin is registered (`app.ts`), so it
 * comes from the URL the caller used and never from what they sent.
 */
export interface ProductRouteOptions {
  product: Product;
}
