import 'server-only';

import { cache } from 'react';
import { notFound } from 'next/navigation';
import {
  PRODUCTS,
  type CompanyMemberDto,
  type CompanyProductDto,
  type Product,
  type ProfileDto,
} from '@oliveira/schemas';
import { requestAccount } from '@/lib/api/accounts';
import { requestProfileList } from '@/lib/api/profiles';
import { EMPTY_LIST_QUERY } from '@/lib/list-query';
import { getMe } from '@/lib/permissions';
import { PRODUCT_AVAILABILITY } from '@/lib/products';
import { requireSession } from '@/lib/session';
import { getCompanyMembers } from '../../_data-access/get-company-members';

export interface MemberProductView {
  product: Product;
  /** The product is open to companies at all (`PRODUCT_AVAILABILITY`). */
  available: boolean;
  contract: CompanyProductDto | undefined;
  hasSeat: boolean;
  /**
   * Whether the viewer may manage this product's profiles — asked of the
   * product's own API, which answers only to someone holding a seat there and
   * its `profile:manage`. The Platform never decides it.
   */
  canManageProfiles: boolean;
  /** The member's profile in the product; `undefined` when the viewer can't see it. */
  profile: { id: number; name: string } | null | undefined;
  /** The product's profiles to choose from — empty unless `canManageProfiles`. */
  profiles: ProfileDto[];
}

export interface MemberView {
  companyName: string;
  member: CompanyMemberDto;
  products: MemberProductView[];
  viewerIsSuperAdmin: boolean;
  viewerAccountId: number;
}

/**
 * Everything the member's view and edit pages show. Company admins only (the
 * members list is); an id that isn't one of this company's members is a 404.
 */
export const getMemberView = cache(async (membershipId: string): Promise<MemberView> => {
  const [{ token }, company, me] = await Promise.all([
    requireSession(),
    getCompanyMembers(),
    getMe(),
  ]);
  const member = company.members.find((candidate) => candidate.id === membershipId);

  if (!member) {
    notFound();
  }

  const products = await Promise.all(
    PRODUCTS.map(async (product): Promise<MemberProductView> => {
      const hasSeat = member.products.includes(product);
      const profilesResult = await requestProfileList(
        token,
        { ...EMPTY_LIST_QUERY, pageSize: 100 },
        product,
      );
      const canManageProfiles = profilesResult.success;
      const accountResult =
        canManageProfiles && hasSeat
          ? await requestAccount(token, member.accountId, product)
          : null;

      return {
        product,
        available: PRODUCT_AVAILABILITY[product].available,
        contract: company.products.find((contract) => contract.product === product),
        hasSeat,
        canManageProfiles,
        profile: accountResult?.success
          ? accountResult.data.profile
          : canManageProfiles
            ? null
            : undefined,
        profiles: profilesResult.success ? profilesResult.data.items : [],
      };
    }),
  );

  return {
    companyName: company.company.name,
    member,
    products,
    viewerIsSuperAdmin: me.account.role === 'SUPER_ADMIN',
    viewerAccountId: me.account.id,
  };
});
