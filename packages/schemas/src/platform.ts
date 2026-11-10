import { z } from 'zod';
import type { AccountRole } from './auth.js';

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

export const contractStatusSchema = z.enum(['ACTIVE', 'SUSPENDED']);

export type ContractStatus = z.infer<typeof contractStatusSchema>;

/* -------------------------------------------------------------------------- */
/* Company members and seats (docs/especificacoes/platform-access-model.md)     */
/* -------------------------------------------------------------------------- */

/** `POST /api/company/members` — adds an existing, company-less account by e-mail. */
export const memberAddSchema = z.object({
  email: z.string().trim().email('Invalid email'),
});

export type MemberAddInput = z.infer<typeof memberAddSchema>;

/** `PATCH /api/company/members/:id` — the membership's own status and company role, never the account's. */
export const memberUpdateSchema = z
  .object({
    status: membershipStatusSchema.optional(),
    role: membershipRoleSchema.optional(),
  })
  .refine((data) => data.status !== undefined || data.role !== undefined, {
    message: 'Provide at least one field to update',
  });

export type MemberUpdateInput = z.infer<typeof memberUpdateSchema>;

/**
 * The member's edit page, as one form: their role in the company account and
 * which products they may open (the Platform's), the profile they hold in each
 * product (each product's own, offered only to whoever may manage it there),
 * and — for a `SUPER_ADMIN` only — the account's Platform role and active flag.
 * `profiles` is a profile id as text, `''` for none.
 */
export const memberEditFormSchema = z.object({
  role: membershipRoleSchema,
  seats: z.object({ ERP: z.boolean(), FSM: z.boolean() }),
  profiles: z.object({ ERP: z.string(), FSM: z.string() }),
  platformRole: z.enum(['SUPER_ADMIN', 'USER']),
  accountActive: z.boolean(),
});

export type MemberEditFormValues = z.infer<typeof memberEditFormSchema>;

/** One member of the caller's company. `id` is the membership's, not the account's. */
export interface CompanyMemberDto {
  id: string;
  accountId: number;
  name: string;
  email: string;
  role: MembershipRole;
  status: MembershipStatus;
  /** The account's role on the Platform — changed only by a `SUPER_ADMIN`. */
  accountRole: AccountRole;
  /** Whether the account can sign in at all — the Platform's, not the company's. */
  accountActive: boolean;
  /** The seats this member holds — meaningful only while the membership is active. */
  products: Product[];
  createdAt: string;
}

/** A contract of the caller's company, with how much of it is in use. `seatLimit: null` is unlimited. */
export interface CompanyProductDto {
  product: Product;
  status: ContractStatus;
  seatLimit: number | null;
  seatsUsed: number;
}

/** `GET /api/company/members` — the members and the contracts their seats are counted against. */
export interface CompanyMembersDto {
  company: { id: string; name: string };
  products: CompanyProductDto[];
  members: CompanyMemberDto[];
}

/** `PUT`/`DELETE` of a seat — `changed` is false when the seat already was (or wasn't) there. */
export interface SeatChangeDto {
  product: Product;
  changed: boolean;
}

/** The caller's place in a company, as `GET /api/auth/me` reports it. */
export interface MeMembership {
  id: string;
  companyId: string;
  companyName: string;
  role: MembershipRole;
}
