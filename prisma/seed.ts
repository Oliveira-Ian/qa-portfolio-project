import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { config as loadEnv } from 'dotenv';
import { PERMISSION_CATALOG, SEED_PROFILE_NAMES, permissionKey } from '@oliveira/schemas';
import { PrismaClient } from '../apps/api/src/generated/prisma/client.js';

// `npm run db:seed` runs this from the repo root, but DATABASE_URL and the
// admin-bootstrap vars live in prisma/.env (the same file prisma.config.ts loads
// for the Prisma CLI) — resolved from this file's own location so it works
// regardless of the caller's working directory.
loadEnv({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

/**
 * Bootstraps the access data every environment needs to be usable: the
 * permission catalog, a handful of starting ERP profiles, a reserved SYSTEM
 * account, the (single, until #60) company with its contracts, and — if the env
 * vars are set — the first administrator.
 *
 * Safe to run repeatedly: every step upserts by a natural key (permission's
 * resource+action, profile's name, account's e-mail) rather than inserting
 * blindly, so re-running after `db:migrate` never creates duplicates.
 */

// The generated client lives in apps/api (see the generator block in schema.prisma) and, like
// the API, talks to Postgres through a driver adapter — no adapter, no client, in Prisma 7.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required — set it in prisma/.env (see prisma/.env.example).');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

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
    description: 'Linked to a member the first time they are granted a seat in the ERP.',
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

type ProductName = 'ERP' | 'FSM';
type MembershipRoleName = 'ADMIN' | 'MEMBER';

/**
 * The contracts of the test company. `seatLimit` is deliberately small so the
 * limit is easy to reach by hand — the real limits are the Oliveira team's to
 * set (docs/adr/0018).
 */
const COMPANY_CONTRACTS: { product: ProductName; seatLimit: number }[] = [
  { product: 'ERP', seatLimit: 20 },
  { product: 'FSM', seatLimit: 10 },
];

const COMPANY_NAME = process.env.SEED_COMPANY_NAME ?? 'Oliveira Demo Company';

/**
 * Until company data is isolated (#60) there is exactly one company, so this
 * reuses whichever one already exists rather than matching on a name that may
 * have changed between runs. The contracts are created but never overwritten —
 * a limit changed later is not the seed's to undo.
 */
async function seedCompany(): Promise<string> {
  const existing = await prisma.company.findFirst({ orderBy: { createdAt: 'asc' } });
  const company = existing ?? (await prisma.company.create({ data: { legalName: COMPANY_NAME } }));

  for (const contract of COMPANY_CONTRACTS) {
    await prisma.companyProduct.upsert({
      where: { companyId_product: { companyId: company.id, product: contract.product } },
      update: {},
      create: {
        companyId: company.id,
        product: contract.product,
        seatLimit: contract.seatLimit,
      },
    });
  }

  console.log(
    `  company: ${existing ? 'already exists' : 'created'} (${company.legalName}), ${COMPANY_CONTRACTS.length} contracts`,
  );
  return company.id;
}

/** Makes the account an active member with exactly the seats given — seats it holds beyond them are left alone. */
async function ensureMember(
  companyId: string,
  accountId: number,
  role: MembershipRoleName,
  seats: ProductName[],
): Promise<void> {
  const membership = await prisma.membership.upsert({
    where: { accountId_companyId: { accountId, companyId } },
    update: { role, status: 'ACTIVE' },
    create: { accountId, companyId, role },
  });

  for (const product of seats) {
    await prisma.productAccess.upsert({
      where: { membershipId_product: { membershipId: membership.id, product } },
      update: {},
      create: { membershipId: membership.id, product },
    });
  }
}

async function linkProfile(accountId: number, profileId: number | undefined): Promise<void> {
  if (!profileId) {
    return;
  }

  await prisma.accountProfile.upsert({
    where: { accountId_profileId: { accountId, profileId } },
    update: {},
    create: { accountId, profileId },
  });
}

async function seedAdmin(companyId: string, profileIdByName: Map<string, number>): Promise<void> {
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

  let accountId: number;

  if (existing) {
    // Role and links are self-healed on every run; the password is deliberately
    // left alone once the account exists — a seed re-run should never silently
    // undo a password the admin has since changed.
    await prisma.accessAccount.update({
      where: { id: existing.id },
      data: { role: 'SUPER_ADMIN', active: true },
    });
    accountId = existing.id;
  } else {
    const created = await prisma.accessAccount.create({
      data: {
        email,
        password: await bcrypt.hash(password, SALT_ROUNDS),
        role: 'SUPER_ADMIN',
        person: { create: { name: 'Administrator', email, types: ['USER'] } },
      },
    });
    accountId = created.id;
  }

  // The bootstrap account holds every layer explicitly — Platform role, company
  // administrator, both seats and the ERP's Administrator profile — because none
  // of them implies another (docs/adr/0018). A real deployment would split them.
  await ensureMember(companyId, accountId, 'ADMIN', ['ERP', 'FSM']);
  await linkProfile(accountId, administratorProfileId);

  console.log(`  admin account: ${existing ? 'already exists, ensured' : 'created'} (${email})`);
}

interface TestAccountSeed {
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'USER';
  /** `null`: no membership at all. */
  membership: { role: MembershipRoleName; seats: ProductName[]; profile?: string } | null;
}

/**
 * One account per row of the access matrix in
 * docs/especificacoes/platform-access-model.md (the fifth, a freshly registered
 * account, comes from `POST /api/auth/register`). Only with SEED_TEST_ACCOUNTS=true
 * — these are for trying the model by hand, never for a real environment.
 */
const TEST_ACCOUNTS: TestAccountSeed[] = [
  {
    email: 'super.admin@oliveira.test',
    name: 'Test Super Admin',
    role: 'SUPER_ADMIN',
    membership: null,
  },
  {
    email: 'company.admin@oliveira.test',
    name: 'Test Company Admin',
    role: 'USER',
    membership: { role: 'ADMIN', seats: [] },
  },
  {
    email: 'erp.member@oliveira.test',
    name: 'Test ERP Member',
    role: 'USER',
    membership: { role: 'MEMBER', seats: ['ERP'], profile: SEED_PROFILE_NAMES.DEFAULT_USER },
  },
  {
    email: 'no.seat@oliveira.test',
    name: 'Test Member Without Seat',
    role: 'USER',
    membership: { role: 'MEMBER', seats: [] },
  },
];

async function seedTestAccounts(
  companyId: string,
  profileIdByName: Map<string, number>,
): Promise<void> {
  if (process.env.SEED_TEST_ACCOUNTS !== 'true') {
    return;
  }

  const password = process.env.SEED_TEST_PASSWORD;

  if (!password) {
    console.warn(
      '  test accounts: skipped — SEED_TEST_ACCOUNTS is on but SEED_TEST_PASSWORD is not set.',
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  for (const seed of TEST_ACCOUNTS) {
    const existing = await prisma.accessAccount.findUnique({ where: { email: seed.email } });

    const account =
      existing ??
      (await prisma.accessAccount.create({
        data: {
          email: seed.email,
          password: passwordHash,
          role: seed.role,
          person: { create: { name: seed.name, email: seed.email, types: ['USER'] } },
        },
      }));

    if (seed.membership) {
      await ensureMember(companyId, account.id, seed.membership.role, seed.membership.seats);
      await linkProfile(
        account.id,
        seed.membership.profile ? profileIdByName.get(seed.membership.profile) : undefined,
      );
    }
  }

  console.log(`  test accounts: ${TEST_ACCOUNTS.length} ensured`);
}

async function main() {
  console.log('Seeding…');

  const permissionIdByKey = await seedPermissions();
  const profileIdByName = await seedProfiles(permissionIdByKey);
  await seedSystemAccount();
  const companyId = await seedCompany();
  await seedAdmin(companyId, profileIdByName);
  await seedTestAccounts(companyId, profileIdByName);

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
