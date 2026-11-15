import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../apps/api/src/generated/prisma/client.js';
import { runWithRequestContext } from '../../apps/api/src/shared/request-context.js';
import { isolationDatabase } from './database';

/** A client that bypasses row-level security — to arrange data and to check what really happened. */
export function createAdminClient(): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: isolationDatabase.adminUrl }),
  });
}

/**
 * The application role with **no** extension: what any code path that skipped
 * the application layer (raw SQL, a second client) would get. Only the database
 * policies stand between it and other companies' rows.
 */
export function createBareAppClient(max = 10): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: isolationDatabase.appUrl, max }),
  });
}

/**
 * Runs `work` as a request of `companyId` would: inside a request context with
 * that company and an actor, awaited inside it (Prisma promises are lazy —
 * docs/adr/0016).
 */
export function asCompany<T>(companyId: string | undefined, work: () => Promise<T>): Promise<T> {
  return runWithRequestContext(
    { actor: { accountId: 1, role: 'USER' }, ...(companyId ? { companyId } : {}) },
    async () => await work(),
  );
}
