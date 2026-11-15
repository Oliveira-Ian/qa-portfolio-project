import { PRODUCTS, type Product } from '@oliveira/schemas';
import { withTransaction, type TransactionClient } from '../../config/prisma.js';
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
export async function lockCompany(tx: TransactionClient, companyId: string): Promise<void> {
  // The ORM has no `FOR UPDATE`. Raw SQL is fine here: this is a repository-layer
  // file, and the statement takes no user input beyond the company id.
  await tx.$queryRaw`SELECT "id" FROM "Company" WHERE "id" = ${companyId} FOR UPDATE`;
}

/**
 * Active members of the company who hold a seat in `product` and one of that
 * product's profiles carrying `profile:manage` — the ones who can still change
 * who may do what there.
 */
export function countProfileManagers(
  tx: TransactionClient,
  companyId: string,
  product: Product,
): Promise<number> {
  return tx.membership.count({
    where: {
      companyId,
      status: 'ACTIVE',
      account: { active: true },
      productAccess: { some: { product } },
      profiles: {
        some: {
          profile: {
            product,
            permissions: {
              some: { permission: { product, resource: 'profile', action: 'manage' } },
            },
          },
        },
      },
    },
  });
}

/** The products that have at least one profile manager — compared before and after a change. */
export async function productsWithProfileManagers(
  tx: TransactionClient,
  companyId: string,
): Promise<Product[]> {
  const managed: Product[] = [];

  for (const product of PRODUCTS) {
    if ((await countProfileManagers(tx, companyId, product)) > 0) {
      managed.push(product);
    }
  }

  return managed;
}

/** Active administrators of the company (`Membership.role = ADMIN`) whose account is active too. */
export function countCompanyAdmins(tx: TransactionClient, companyId: string): Promise<number> {
  return tx.membership.count({
    where: { companyId, role: 'ADMIN', status: 'ACTIVE', account: { active: true } },
  });
}

/**
 * Runs `mutation` in a transaction on the caller's company and refuses (409,
 * rolling everything back) if it leaves the company with nobody able to manage
 * `product`'s profiles — unless nobody could before it either.
 *
 * For repositories whose change *may* remove that ability: unlinking a profile,
 * editing or deleting a profile that carries `profile:manage`. The company is
 * the request context's (`requireCompanyId`), so callers don't pass it.
 */
export async function withProfileManagerGuard<T>(
  product: Product,
  mutation: (tx: TransactionClient) => Promise<T>,
): Promise<T> {
  const companyId = requireCompanyId();

  return withTransaction(async (tx) => {
    await lockCompany(tx, companyId);

    const before = await countProfileManagers(tx, companyId, product);
    const result = await mutation(tx);

    if (before > 0 && (await countProfileManagers(tx, companyId, product)) === 0) {
      throw new ConflictError('At least one member must keep the ability to manage profiles');
    }

    return result;
  });
}
