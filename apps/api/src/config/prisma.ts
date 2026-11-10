import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import {
  getCompanyId,
  isInCompanyTransaction,
  runInCompanyTransactionScope,
} from '../shared/request-context.js';
import { env } from './env.js';
import { TENANT_MODELS, scopeToCompany } from './tenant-scope.js';

/**
 * Prisma 7 talks to Postgres through the `pg` driver, and the driver's pool
 * defaults are not Prisma 5's: `pg` has no connection timeout at all, so a
 * saturated or unreachable database would hang a request forever instead of
 * failing it. The three values below are set on purpose, not left to defaults —
 * they mirror the behaviour this API had before the upgrade (a bounded wait for
 * a connection, idle connections kept warm), with the pool size spelled out.
 */
const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 300_000,
});

const baseClient = new PrismaClient({
  adapter,
  log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

/**
 * A single client for the process — Prisma pools connections internally, so
 * constructing more than one just multiplies open sockets.
 *
 * Tenant isolation (docs/adr/0012) is built into it, in two independent layers:
 *
 * 1. **Application.** On a company-scoped model (`TENANT_MODELS`) every
 *    operation gets the request's company added to its filter or its data
 *    (`tenant-scope.ts`), and one without a company in the request context
 *    throws instead of running unscoped.
 * 2. **Database.** Whenever the request has a company, each operation runs in a
 *    short transaction that first sets `app.current_company_id` — local to that
 *    transaction, so a pooled connection never carries it to the next request.
 *    The row-level security policies read it; with no setting they match nothing.
 *
 * The company always comes from the request context, filled by `requireAuth`
 * from the caller's membership in the database — never from the request body.
 *
 * Only the repository layer imports this; services and controllers never touch
 * Prisma directly, which is what keeps them independent of the database.
 */
export const prisma = baseClient.$extends({
  name: 'tenant-isolation',
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const companyId = getCompanyId();
        const isTenantModel = TENANT_MODELS.has(model);

        if (isTenantModel && !companyId) {
          throw new Error(`${model}.${operation} needs a company in the request context`);
        }

        const scopedArgs = isTenantModel
          ? (scopeToCompany(model, operation, args, companyId!) as typeof args)
          : args;

        // Inside `withTransaction` the setting is already on the transaction's
        // connection; outside a company there is nothing to set.
        if (!companyId || isInCompanyTransaction()) {
          return query(scopedArgs);
        }

        // eslint-disable-next-line no-restricted-syntax -- a batch of two statements, not a unit of work
        const [, result] = await baseClient.$transaction([
          baseClient.$executeRaw`SELECT set_config('app.current_company_id', ${companyId}, true)`,
          query(scopedArgs),
        ]);

        return result;
      },
    },
  },
});

export type AppPrismaClient = typeof prisma;
export type TransactionClient = Parameters<Parameters<AppPrismaClient['$transaction']>[0]>[0];

/**
 * The only way to run several operations as one unit of work. Opens an
 * interactive transaction, sets the request's company on it once, and runs
 * `work` with every operation on `tx` inside that same transaction.
 *
 * `prisma.$transaction` must not be called directly (an ESLint rule enforces
 * it): an operation inside it would be wrapped in a transaction of its own on a
 * different connection — outside the unit of work and, for a row lock, a
 * deadlock. Keep the work database-only: a pooled connection is held for as long
 * as it runs (no bcrypt, no outbound calls).
 */
export function withTransaction<T>(work: (tx: TransactionClient) => Promise<T>): Promise<T> {
  const companyId = getCompanyId();

  // eslint-disable-next-line no-restricted-syntax -- the one sanctioned call, see above
  return prisma.$transaction(async (tx) => {
    if (companyId) {
      await tx.$executeRaw`SELECT set_config('app.current_company_id', ${companyId}, true)`;
    }

    // The mark is opened inside the callback, not around `$transaction`: a
    // Prisma promise only starts when awaited, which may be outside the scope.
    return runInCompanyTransactionScope(() => work(tx));
  });
}

/**
 * Refuses to start on a database role that row-level security does not apply
 * to. A superuser or a `BYPASSRLS` role would make every policy silently inert —
 * the API would work, and isolate nothing. Run once at boot (`server.ts`).
 */
export async function assertRestrictedDatabaseRole(): Promise<void> {
  const [role] = await baseClient.$queryRaw<
    { name: string; isSuperuser: boolean; bypassesRls: boolean }[]
  >`SELECT rolname AS "name", rolsuper AS "isSuperuser", rolbypassrls AS "bypassesRls"
    FROM pg_roles WHERE rolname = current_user`;

  if (!role || role.isSuperuser || role.bypassesRls) {
    throw new Error(
      `DATABASE_URL connects as "${role?.name ?? 'unknown'}", which bypasses row-level security. ` +
        'Use the application role created by `npm run db:roles` (docs/operations/environments.md).',
    );
  }
}
