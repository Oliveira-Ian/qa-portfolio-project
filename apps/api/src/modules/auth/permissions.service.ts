import { permissionKey, type PermissionKey } from '@oliveira/schemas';
import { prisma } from '../../config/prisma.js';

/**
 * The union of every permission every AccessProfile linked to this account
 * grants. An account with no profile links (a database that hasn't been
 * seeded, or an account nobody has assigned a profile to yet) simply has no
 * permissions — not an error, just an empty set.
 *
 * Doesn't special-case any role — none is exempt (docs/adr/0018) — and doesn't
 * look at seats either: whether the account may enter the product at all is
 * `requireProductAccess`'s question, asked before this one.
 */
export async function getEffectivePermissions(accountId: number): Promise<Set<PermissionKey>> {
  const links = await prisma.accountProfile.findMany({
    where: { accountId },
    select: {
      profile: {
        select: {
          permissions: {
            select: { permission: { select: { resource: true, action: true } } },
          },
        },
      },
    },
  });

  const keys = new Set<PermissionKey>();

  for (const link of links) {
    for (const { permission } of link.profile.permissions) {
      keys.add(permissionKey(permission.resource, permission.action) as PermissionKey);
    }
  }

  return keys;
}
