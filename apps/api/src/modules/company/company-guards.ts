import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import { ConflictError } from '../../shared/errors.js';
import { requireCompanyId } from '../../shared/request-context.js';

/**
 * The lockout guards of docs/adr/0018 and docs/especificacoes/platform-access-model.md
 * (rule 6). Each is "the change must not take a company from having someone
 * able to do X to having no one": checked inside the transaction that makes the
 * change, with the company row locked, so two administrators removing each
 * other at the same moment cannot both pass a check that neither sees the
 * other's half of.
 */

/** Serializes every guarded change of one company; released when the transaction ends. */
export async function lockCompany(tx: Prisma.TransactionClient, companyId: string): Promise<void> {
  // The ORM has no `FOR UPDATE`. Raw SQL is fine here: this is a repository-layer
  // file, and the statement takes no user input beyond the company id.
  await tx.$queryRaw`SELECT "id" FROM "Company" WHERE "id" = ${companyId} FOR UPDATE`;
}

/**
 * Active members of the company who hold a seat in the ERP and a profile that
 * carries `profile:manage` — the ones who can still change who may do what there.
 */
export function countProfileManagers(
  tx: Prisma.TransactionClient,
  companyId: string,
): Promise<number> {
  return tx.accessAccount.count({
    where: {
      active: true,
      memberships: {
        some: {
          companyId,
          status: 'ACTIVE',
          productAccess: { some: { product: 'ERP' } },
        },
      },
      profiles: {
        some: {
          profile: {
            permissions: { some: { permission: { resource: 'profile', action: 'manage' } } },
          },
        },
      },
    },
  });
}

/** Active administrators of the company (`Membership.role = ADMIN`) whose account is active too. */
export function countCompanyAdmins(
  tx: Prisma.TransactionClient,
  companyId: string,
): Promise<number> {
  return tx.membership.count({
    where: { companyId, role: 'ADMIN', status: 'ACTIVE', account: { active: true } },
  });
}

/**
 * Runs `mutation` in a transaction on the caller's company and refuses (409,
 * rolling everything back) if it leaves the company with nobody able to manage
 * the ERP's profiles — unless nobody could before it either.
 *
 * For repositories whose change *may* remove that ability: unlinking a profile,
 * editing or deleting a profile that carries `profile:manage`. The company is
 * the request context's (`requireCompanyId`), so callers don't pass it.
 */
export async function withProfileManagerGuard<T>(
  mutation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  const companyId = requireCompanyId();

  return prisma.$transaction(async (tx) => {
    await lockCompany(tx, companyId);

    const before = await countProfileManagers(tx, companyId);
    const result = await mutation(tx);

    if (before > 0 && (await countProfileManagers(tx, companyId)) === 0) {
      throw new ConflictError('At least one member must keep the ability to manage profiles');
    }

    return result;
  });
}
