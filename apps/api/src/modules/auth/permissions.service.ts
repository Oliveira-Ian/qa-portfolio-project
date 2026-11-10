import { permissionKey, type Product, type ProductPermissionKey } from '@oliveira/schemas';
import { prisma } from '../../config/prisma.js';

/**
 * The union of every permission the member's profiles in `product` grant, in
 * the caller's company (the query is company-scoped like every other —
 * docs/adr/0012). A member with no profile there simply has no permissions —
 * not an error, just an empty set. Only that product's permissions count, so an
 * ERP profile never grants anything in the FSM.
 *
 * Doesn't special-case any role — none is exempt (docs/adr/0018) — and doesn't
 * look at seats either: whether the member may enter the product at all is
 * `requireProductAccess`'s question, asked before this one.
 */
export async function getEffectivePermissions<P extends Product>(
  membershipId: string,
  product: P,
): Promise<Set<ProductPermissionKey<P>>> {
  const links = await prisma.membershipProfile.findMany({
    where: { membershipId, product },
    select: {
      profile: {
        select: {
          permissions: {
            where: { permission: { product } },
            select: { permission: { select: { resource: true, action: true } } },
          },
        },
      },
    },
  });

  const keys = new Set<ProductPermissionKey<P>>();

  for (const link of links) {
    for (const { permission } of link.profile.permissions) {
      keys.add(permissionKey(permission.resource, permission.action) as ProductPermissionKey<P>);
    }
  }

  return keys;
}
