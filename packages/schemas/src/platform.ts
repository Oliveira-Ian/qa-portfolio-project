import { z } from 'zod';

/**
 * What the Platform knows about a product, shared by the API (which guards it)
 * and the web (which shows it). A product is code — routes, screens, guards —
 * so this list only grows together with a migration for the `Product` enum in
 * `prisma/schema.prisma`; docs/adr/0018 and 0019.
 */
export const PRODUCTS = ['ERP', 'FSM'] as const;

export const productSchema = z.enum(PRODUCTS);

export type Product = z.infer<typeof productSchema>;

export const PRODUCT_LABELS: Record<Product, string> = {
  ERP: 'Oliveira ERP',
  FSM: 'Oliveira FSM',
};

/** The company's own administrator flag — independent of the account's Platform role. */
export const membershipRoleSchema = z.enum(['ADMIN', 'MEMBER']);

export type MembershipRole = z.infer<typeof membershipRoleSchema>;

export const membershipStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);

export type MembershipStatus = z.infer<typeof membershipStatusSchema>;

/** The caller's place in a company, as `GET /api/auth/me` reports it. */
export interface MeMembership {
  id: string;
  companyId: string;
  companyName: string;
  role: MembershipRole;
}
