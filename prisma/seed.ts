import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config as loadEnv } from 'dotenv';
import { PERMISSION_CATALOG, SEED_PROFILE_NAMES, permissionKey } from '@oliveira/schemas';

// `npm run db:seed` runs this from the repo root, but DATABASE_URL and the
// admin-bootstrap vars live in prisma/.env (same convention the Prisma CLI
// itself uses for --schema=prisma/schema.prisma) — resolved from this file's
// own location so it works regardless of the caller's working directory.
loadEnv({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

/**
 * Bootstraps the access-control data every environment needs to be usable:
 * the permission catalog, a handful of starting profiles, a reserved SYSTEM
 * account, and — if the env vars are set — the first ADMIN.
 *
 * Safe to run repeatedly: every step upserts by a natural key (permission's
 * resource+action, profile's name, account's e-mail) rather than inserting
 * blindly, so re-running after `db:migrate` never creates duplicates.
 */

const prisma = new PrismaClient();

// Matches apps/api/src/modules/auth/password.ts — kept in sync by hand since
// this script runs outside the API's module graph.
const SALT_ROUNDS = 10;

const SYSTEM_ACCOUNT_EMAIL = process.env.SYSTEM_ACCOUNT_EMAIL ?? 'system@oliveira.internal';

interface ProfileSeed {
  name: string;
  description: string;
  isSystem: boolean;
  isDefault: boolean;
  /** Permission keys (`"resource:action"`) this profile starts with. */
  permissions: string[];
}

const ALL_PERMISSION_KEYS = PERMISSION_CATALOG.map((entry) =>
  permissionKey(entry.resource, entry.action),
);

const PROFILE_SEEDS: ProfileSeed[] = [
  {
    name: SEED_PROFILE_NAMES.ADMINISTRATOR,
    description: 'Full access to every business permission in the catalog.',
    isSystem: true,
    isDefault: false,
    permissions: ALL_PERMISSION_KEYS,
  },
  {
    name: SEED_PROFILE_NAMES.MANAGER,
    description: 'Day-to-day operation: can view, create and edit, but not delete.',
    isSystem: false,
    isDefault: false,
    permissions: ['person:view', 'person:create', 'person:edit'],
  },
  {
    name: SEED_PROFILE_NAMES.FINANCE,
    description: 'Read access for billing and collections work.',
    isSystem: false,
    isDefault: false,
    permissions: ['person:view'],
  },
  {
    name: SEED_PROFILE_NAMES.CASHIER,
    description: 'Read access at the point of sale.',
    isSystem: false,
    isDefault: false,
    permissions: ['person:view'],
  },
  {
    name: SEED_PROFILE_NAMES.DEFAULT_USER,
    description: 'Assigned automatically to every self-registered account.',
    isSystem: true,
    isDefault: true,
    permissions: ['person:view'],
  },
];

async function seedPermissions(): Promise<Map<string, number>> {
  const idByKey = new Map<string, number>();

  for (const entry of PERMISSION_CATALOG) {
    const row = await prisma.permission.upsert({
      where: { resource_action: { resource: entry.resource, action: entry.action } },
      update: { label: entry.label },
      create: { resource: entry.resource, action: entry.action, label: entry.label },
    });

    idByKey.set(permissionKey(entry.resource, entry.action), row.id);
  }

  console.log(`  permissions: ${idByKey.size} in catalog`);
  return idByKey;
}

// The seeded profile names moved from Portuguese to English (the project's
// Language Standard, `.claude/rules/rules-global.md`) after some databases had
// already been seeded under the old names. `seedProfiles()` upserts by `name`
// (`AccessProfile.name` is the unique key — there's no separate slug/id), so
// swapping `SEED_PROFILE_NAMES` alone would upsert a brand-new English row
// and leave the old Portuguese one orphaned, silently duplicating "Admin",
// "Default user", etc. This renames any surviving old-named row in place
// first — preserves its id and every existing `AccountProfile`/
// `ProfilePermission` link — before the normal upsert-by-new-name runs. A
// no-op once every database has been renamed once (no row left with the old
// name for `updateMany` to match).
const LEGACY_PROFILE_NAMES: Record<string, string> = {
  Administrador: SEED_PROFILE_NAMES.ADMINISTRATOR,
  Gerente: SEED_PROFILE_NAMES.MANAGER,
  Financeiro: SEED_PROFILE_NAMES.FINANCE,
  Caixa: SEED_PROFILE_NAMES.CASHIER,
  'Usuário Padrão': SEED_PROFILE_NAMES.DEFAULT_USER,
};

async function renameLegacyProfileNames(): Promise<void> {
  let renamed = 0;

  for (const [oldName, newName] of Object.entries(LEGACY_PROFILE_NAMES)) {
    const result = await prisma.accessProfile.updateMany({
      where: { name: oldName },
      data: { name: newName },
    });

    renamed += result.count;
  }

  if (renamed > 0) {
    console.log(`  profiles: renamed ${renamed} from legacy Portuguese names`);
  }
}

async function seedProfiles(permissionIdByKey: Map<string, number>): Promise<Map<string, number>> {
  await renameLegacyProfileNames();

  const idByName = new Map<string, number>();

  for (const seed of PROFILE_SEEDS) {
    const profile = await prisma.accessProfile.upsert({
      where: { name: seed.name },
      update: { description: seed.description, isSystem: seed.isSystem, isDefault: seed.isDefault },
      create: {
        name: seed.name,
        description: seed.description,
        isSystem: seed.isSystem,
        isDefault: seed.isDefault,
      },
    });

    // Re-synced from scratch on every run rather than diffed — simple, and
    // correct as long as these seeded profiles stay system-managed. A profile
    // a company creates through the admin UI is never touched by this script.
    await prisma.profilePermission.deleteMany({ where: { profileId: profile.id } });
    await prisma.profilePermission.createMany({
      data: seed.permissions.map((key) => {
        const permissionId = permissionIdByKey.get(key);

        if (!permissionId) {
          throw new Error(`Profile "${seed.name}" references unknown permission "${key}"`);
        }

        return { profileId: profile.id, permissionId };
      }),
    });

    idByName.set(seed.name, profile.id);
  }

  console.log(`  profiles: ${idByName.size} seeded`);
  return idByName;
}

async function seedSystemAccount(): Promise<void> {
  const existing = await prisma.accessAccount.findUnique({
    where: { email: SYSTEM_ACCOUNT_EMAIL },
  });

  if (existing) {
    console.log(`  system account: already exists (${SYSTEM_ACCOUNT_EMAIL})`);
    return;
  }

  // A random, never-shared password — role SYSTEM can't log in interactively
  // once the authorization engine enforces that (a later phase), so nothing
  // about this hash needs to be known by anyone.
  const passwordHash = await bcrypt.hash(randomUUID(), SALT_ROUNDS);

  await prisma.person.create({
    data: {
      name: 'System',
      types: ['USER'],
      account: {
        create: {
          email: SYSTEM_ACCOUNT_EMAIL,
          password: passwordHash,
          role: 'SYSTEM',
        },
      },
    },
  });

  console.log(`  system account: created (${SYSTEM_ACCOUNT_EMAIL})`);
}

async function seedAdmin(profileIdByName: Map<string, number>): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn(
      '  admin account: skipped — set ADMIN_EMAIL and ADMIN_PASSWORD in prisma/.env to bootstrap one.',
    );
    return;
  }

  const administratorProfileId = profileIdByName.get(SEED_PROFILE_NAMES.ADMINISTRATOR);

  const existing = await prisma.accessAccount.findUnique({ where: { email } });

  if (existing) {
    // Role and profile link are self-healed on every run; the password is
    // deliberately left alone once the account exists — a seed re-run should
    // never silently undo a password the admin has since changed.
    await prisma.accessAccount.update({
      where: { id: existing.id },
      data: { role: 'ADMIN', active: true },
    });

    if (administratorProfileId) {
      await prisma.accountProfile.upsert({
        where: {
          accountId_profileId: { accountId: existing.id, profileId: administratorProfileId },
        },
        update: {},
        create: { accountId: existing.id, profileId: administratorProfileId },
      });
    }

    console.log(`  admin account: already exists, role/profile ensured (${email})`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const account = await prisma.accessAccount.create({
    data: {
      email,
      password: passwordHash,
      role: 'ADMIN',
      person: {
        create: {
          name: 'Administrator',
          email,
          types: ['USER'],
        },
      },
    },
  });

  if (administratorProfileId) {
    await prisma.accountProfile.create({
      data: { accountId: account.id, profileId: administratorProfileId },
    });
  }

  console.log(`  admin account: created (${email})`);
}

/**
 * Any USER-role account with zero AccessProfile links has zero effective
 * permissions — locked out of everything now that routes enforce them. Two
 * ways that happens: an account created before this seed ever ran (e.g. the
 * `User` rows migrated to `AccessAccount` in an earlier phase, before
 * profiles existed), or a fresh database seeded before the default profile
 * existed. Neither is a "real" account decision, so linking them to the
 * default profile here is a repair, not a business rule — ADMIN/SYSTEM
 * accounts are untouched, and any account that already has a profile
 * (including one deliberately left with none) is left alone.
 */
async function backfillDefaultProfileForOrphanedAccounts(
  profileIdByName: Map<string, number>,
): Promise<void> {
  const defaultProfileId = profileIdByName.get(SEED_PROFILE_NAMES.DEFAULT_USER);

  if (!defaultProfileId) {
    return;
  }

  const orphaned = await prisma.accessAccount.findMany({
    where: { role: 'USER', profiles: { none: {} } },
    select: { id: true, email: true },
  });

  for (const account of orphaned) {
    await prisma.accountProfile.create({
      data: { accountId: account.id, profileId: defaultProfileId },
    });
    console.log(`  backfilled default profile for orphaned account: ${account.email}`);
  }

  if (orphaned.length === 0) {
    console.log('  no orphaned accounts to backfill');
  }
}

async function main() {
  console.log('Seeding…');

  const permissionIdByKey = await seedPermissions();
  const profileIdByName = await seedProfiles(permissionIdByKey);
  await seedSystemAccount();
  await seedAdmin(profileIdByName);
  await backfillDefaultProfileForOrphanedAccounts(profileIdByName);

  console.log('Done.');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
