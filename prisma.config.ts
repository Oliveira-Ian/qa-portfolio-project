import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 no longer reads a `.env` on its own, and no longer takes the
 * connection URL from `schema.prisma`. `DATABASE_URL` and the seed's admin
 * bootstrap variables live in `prisma/.env` (`prisma/.env.example`), the same
 * file `prisma/seed.ts` reads — resolved from this file's own location so the
 * CLI behaves the same whatever directory it is run from.
 *
 * dotenv never overrides a variable that is already set, which is what lets CI
 * and Docker inject `DATABASE_URL` without a file. `process.env` is read
 * directly rather than through Prisma's `env()` helper: `env()` throws when the
 * variable is missing, and `prisma generate` (lint, Docker build) has no
 * database to talk to.
 */
const prismaDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'prisma');

loadEnv({ path: path.join(prismaDir, '.env') });

const databaseUrl = process.env['DATABASE_URL'];

export default defineConfig({
  schema: path.join(prismaDir, 'schema.prisma'),
  migrations: {
    path: path.join(prismaDir, 'migrations'),
    seed: 'tsx prisma/seed.ts',
  },
  // Left out (not `undefined`) when unset — `exactOptionalPropertyTypes` — so a command that
  // never connects, like `prisma generate`, still loads this file.
  datasource: databaseUrl === undefined ? {} : { url: databaseUrl },
});
