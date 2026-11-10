import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../apps/api/src/generated/prisma/client.js';
import { isolationDatabase } from './database';

const root = path.resolve(import.meta.dirname, '../..');
const bin = (tool: string) =>
  path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? `${tool}.cmd` : tool);

/**
 * Recreates the isolation database from scratch on every run: the roles of
 * `prisma/setup-roles.ts`, then every migration — the same path a real
 * environment takes, so the policies under test are the ones that ship.
 */
export default async function setup(): Promise<void> {
  const { name, ownerUrl, appUrl, adminUrl } = isolationDatabase;

  if (!name.endsWith('_test')) {
    throw new Error(`Refusing to recreate "${name}": the isolation database must end in _test.`);
  }

  const serverUrl = new URL(ownerUrl);
  serverUrl.pathname = '/postgres';
  const server = new PrismaClient({
    adapter: new PrismaPg({ connectionString: serverUrl.toString() }),
  });

  try {
    await server.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
    await server.$executeRawUnsafe(`CREATE DATABASE "${name}"`);
  } finally {
    await server.$disconnect();
  }

  const env = {
    ...process.env,
    MIGRATION_DATABASE_URL: ownerUrl,
    DATABASE_URL: appUrl,
    ADMIN_DATABASE_URL: adminUrl,
  };
  const options = { cwd: root, env, stdio: 'pipe' as const, shell: process.platform === 'win32' };

  execFileSync(bin('tsx'), ['prisma/setup-roles.ts'], options);
  execFileSync(bin('prisma'), ['migrate', 'deploy'], options);
  // Again, now that the migration history table exists: it is the owner's alone.
  execFileSync(bin('tsx'), ['prisma/setup-roles.ts'], options);
}
