import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

/**
 * A single client for the process — Prisma pools connections internally, so
 * constructing more than one just multiplies open sockets.
 *
 * Only the repository layer imports this; services and controllers never touch
 * Prisma directly, which is what keeps them independent of the database.
 */
export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});
