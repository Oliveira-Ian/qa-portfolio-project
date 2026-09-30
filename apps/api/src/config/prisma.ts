import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { env } from './env.js';

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

/**
 * A single client for the process — Prisma pools connections internally, so
 * constructing more than one just multiplies open sockets.
 *
 * Only the repository layer imports this; services and controllers never touch
 * Prisma directly, which is what keeps them independent of the database.
 */
export const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});
