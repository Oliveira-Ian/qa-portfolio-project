import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaPg } from '@prisma/adapter-pg';
import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '../apps/api/src/generated/prisma/client.js';

/**
 * Creates (or brings up to date) the two database roles row-level security
 * depends on (docs/adr/0012), and grants them what they need. Idempotent: run it
 * before `prisma migrate deploy` on a new database, and again whenever a password
 * changes.
 *
 * - The **application role** (from `DATABASE_URL`) is what the API connects as:
 *   not a superuser, no `BYPASSRLS`, not the owner of any table — so the
 *   policies always apply to it and it cannot turn them off.
 * - The **admin role** (from `ADMIN_DATABASE_URL`) has `BYPASSRLS`: the seed,
 *   provisioning a company and resetting the demo use it, never the API.
 * - The **owner** is whoever `MIGRATION_DATABASE_URL` connects as; it runs this
 *   script and the migrations, and owns the tables.
 *
 * Role names and passwords are read from the connection strings themselves, so
 * there is one place to change them.
 */

loadEnv({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

const ROLE_NAME = /^[a-z_][a-z0-9_]*$/;

interface RoleCredentials {
  name: string;
  password: string;
}

function credentialsFrom(variable: string): RoleCredentials {
  const value = process.env[variable];

  if (!value) {
    throw new Error(`${variable} is required — see prisma/.env.example.`);
  }

  const url = new URL(value);
  const name = decodeURIComponent(url.username);
  const password = decodeURIComponent(url.password);

  if (!ROLE_NAME.test(name)) {
    throw new Error(`${variable}: "${name}" is not a plain lower-case role name.`);
  }

  if (!password) {
    throw new Error(`${variable} must carry a password.`);
  }

  return { name, password };
}

/** A string literal for SQL that cannot take a bind parameter (CREATE/ALTER ROLE). */
function literal(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

async function main(): Promise<void> {
  const ownerUrl = process.env.MIGRATION_DATABASE_URL;

  if (!ownerUrl) {
    throw new Error('MIGRATION_DATABASE_URL is required — the role that owns the tables.');
  }

  const app = credentialsFrom('DATABASE_URL');
  const admin = credentialsFrom('ADMIN_DATABASE_URL');
  const owner = decodeURIComponent(new URL(ownerUrl).username);

  if (app.name === owner || admin.name === owner || app.name === admin.name) {
    throw new Error(
      'DATABASE_URL, ADMIN_DATABASE_URL and MIGRATION_DATABASE_URL must use three different roles.',
    );
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: ownerUrl }) });

  try {
    const roles: [RoleCredentials, string][] = [
      [app, 'NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS'],
      [admin, 'NOSUPERUSER NOCREATEDB NOCREATEROLE BYPASSRLS'],
    ];

    for (const [role, attributes] of roles) {
      const exists = await prisma.$queryRaw<{ exists: boolean }[]>`
        SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = ${role.name}) AS "exists"`;
      const verb = exists[0]?.exists ? 'ALTER' : 'CREATE';

      await prisma.$executeRawUnsafe(
        `${verb} ROLE "${role.name}" LOGIN PASSWORD ${literal(role.password)} ${attributes}`,
      );
      console.log(`  role ${role.name}: ${verb === 'CREATE' ? 'created' : 'updated'}`);
    }

    const database = (await prisma.$queryRaw<{ db: string }[]>`SELECT current_database() AS db`)[0]!
      .db;
    const grantees = `"${app.name}", "${admin.name}"`;

    const statements = [
      `GRANT CONNECT ON DATABASE "${database}" TO ${grantees}`,
      `GRANT USAGE ON SCHEMA public TO ${grantees}`,
      `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${grantees}`,
      `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${grantees}`,
      // Tables and sequences a later migration creates inherit the same grants.
      `ALTER DEFAULT PRIVILEGES FOR ROLE "${owner}" IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${grantees}`,
      `ALTER DEFAULT PRIVILEGES FOR ROLE "${owner}" IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${grantees}`,
    ];

    for (const statement of statements) {
      await prisma.$executeRawUnsafe(statement);
    }

    // Migration history is the owner's alone.
    const history = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT to_regclass('public._prisma_migrations') IS NOT NULL AS "exists"`;

    if (history[0]?.exists) {
      await prisma.$executeRawUnsafe(`REVOKE ALL ON "_prisma_migrations" FROM ${grantees}`);
    }

    console.log(
      `  grants: ${app.name} and ${admin.name} on ${database} (tables owned by ${owner})`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
