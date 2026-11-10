import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { config as loadEnv } from 'dotenv';
import { PRODUCTS, SEED_PROFILE_NAMES, type Product } from '@oliveira/schemas';
import { PrismaClient } from '../apps/api/src/generated/prisma/client.js';
import { provisionProductProfiles, seedPermissionCatalog } from './reference-profiles.js';

// `npm run db:seed` runs this from the repo root, but the connection strings and
// the admin-bootstrap vars live in prisma/.env (the same file prisma.config.ts
// loads for the Prisma CLI) — resolved from this file's own location so it works
// regardless of the caller's working directory.
loadEnv({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

/**
 * Bootstraps the access data every environment needs to be usable: the
 * permission catalog of every product, a reserved SYSTEM account, the bootstrap
 * company with its contracts, the reference profiles of each contracted product
 * in every company, and — if the env vars are set — the first administrator.
 *
 * Safe to run repeatedly: every step upserts by a natural key (a permission's
 * product+resource+action, a profile's company+product+name, an account's
 * e-mail) and never overwrites what a company made of its profiles.
 */

// The generated client lives in apps/api (see the generator block in schema.prisma) and, like
// the API, talks to Postgres through a driver adapter — no adapter, no client, in Prisma 7.
//
// The seed writes into every company, so it connects as the role that bypasses
// row-level security (docs/adr/0012) — never as the API's DATABASE_URL, which
// sees nothing without a company and would refuse every company-scoped insert.
// The table owner works too (a database without the separate admin role yet).
const connectionString = process.env.ADMIN_DATABASE_URL ?? process.env.MIGRATION_DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'ADMIN_DATABASE_URL (or MIGRATION_DATABASE_URL) is required — set it in prisma/.env (see prisma/.env.example).',
  );
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

// Matches apps/api/src/modules/auth/password.ts — kept in sync by hand since
// this script runs outside the API's module graph.
const SALT_ROUNDS = 10;

const SYSTEM_ACCOUNT_EMAIL = process.env.SYSTEM_ACCOUNT_EMAIL ?? 'system@oliveira.internal';

type MembershipRoleName = 'ADMIN' | 'MEMBER';

/** Profile ids by product, then by name, for one company. */
type CompanyProfiles = Record<Product, Map<string, number>>;

async function seedPermissions(): Promise<Record<Product, Map<string, number>>> {
  const catalogs = {} as Record<Product, Map<string, number>>;

  for (const product of PRODUCTS) {
    catalogs[product] = await seedPermissionCatalog(prisma, product);
  }

  console.log(
    `  permissions: ${PRODUCTS.map((product) => `${product} ${catalogs[product].size}`).join(', ')}`,
  );
  return catalogs;
}

// The seeded ERP profile names moved from Portuguese to English (the project's
// Language Standard, `.claude/rules/rules-global.md`) after some databases had
// already been seeded under the old names. Renamed in place first — keeping
// their ids and links — so provisioning finds them instead of adding English
// duplicates. A no-op once every database has been renamed.
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
      where: { product: 'ERP', name: oldName },
      data: { name: newName },
    });

    renamed += result.count;
  }

  if (renamed > 0) {
    console.log(`  profiles: renamed ${renamed} from legacy Portuguese names`);
  }
}

async function seedSystemAccount(): Promise<void> {
  const existing = await prisma.accessAccount.findUnique({
    where: { email: SYSTEM_ACCOUNT_EMAIL },
  });

  if (existing) {
    console.log(`  system account: already exists (${SYSTEM_ACCOUNT_EMAIL})`);
    return;
  }

  // A random, never-shared password — role SYSTEM can't log in interactively,
  // so nothing about this hash needs to be known by anyone.
  const passwordHash = await bcrypt.hash(randomUUID(), SALT_ROUNDS);

  await prisma.accessAccount.create({
    data: { name: 'System', email: SYSTEM_ACCOUNT_EMAIL, password: passwordHash, role: 'SYSTEM' },
  });

  console.log(`  system account: created (${SYSTEM_ACCOUNT_EMAIL})`);
}

/**
 * The contracts of the bootstrap company. `seatLimit` is deliberately small so
 * the limit is easy to reach by hand — the real limits are the Oliveira team's
 * to set (docs/adr/0018).
 */
const COMPANY_CONTRACTS: { product: Product; seatLimit: number }[] = [
  { product: 'ERP', seatLimit: 20 },
  { product: 'FSM', seatLimit: 10 },
];

const COMPANY_NAME = process.env.SEED_COMPANY_NAME ?? 'Oliveira Demo Company';

/**
 * The bootstrap company: reuses the oldest one rather than matching on a name
 * that may have changed between runs. Other companies (the demo's, a test's)
 * are provisioned by their own scripts. The contracts are created but never
 * overwritten — a limit changed later is not the seed's to undo.
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

/**
 * Every company gets the reference profiles of every product it has a contract
 * for — copied once, then the company's to change. Returns the bootstrap
 * company's profiles.
 */
async function seedReferenceProfiles(
  catalogs: Record<Product, Map<string, number>>,
  bootstrapCompanyId: string,
): Promise<CompanyProfiles> {
  await renameLegacyProfileNames();

  const contracts = await prisma.companyProduct.findMany({
    select: { companyId: true, product: true },
  });
  const bootstrap = { ERP: new Map(), FSM: new Map() } as CompanyProfiles;

  for (const { companyId, product } of contracts) {
    const profiles = await provisionProductProfiles(prisma, companyId, product, catalogs[product]);

    if (companyId === bootstrapCompanyId) {
      bootstrap[product] = profiles;
    }
  }

  console.log(`  profiles: reference profiles ensured for ${contracts.length} contracts`);
  return bootstrap;
}

/** Makes the account an active member with at least the seats given; returns the membership id. */
async function ensureMember(
  companyId: string,
  accountId: number,
  role: MembershipRoleName,
  seats: Product[],
): Promise<string> {
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

  return membership.id;
}

/** Sets the member's one profile in `product` — replacing another, if they had one. */
async function linkProfile(
  companyId: string,
  membershipId: string,
  product: Product,
  profileId: number | undefined,
): Promise<void> {
  if (!profileId) {
    return;
  }

  await prisma.membershipProfile.upsert({
    where: { membershipId_product: { membershipId, product } },
    update: { profileId },
    create: { companyId, membershipId, product, profileId },
  });
}

async function seedAdmin(companyId: string, profiles: CompanyProfiles): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn(
      '  admin account: skipped — set ADMIN_EMAIL and ADMIN_PASSWORD in prisma/.env to bootstrap one.',
    );
    return;
  }

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
        name: 'Administrator',
      },
    });
    accountId = created.id;
  }

  // The bootstrap account holds every layer explicitly — Platform role, company
  // administrator, both seats and each product's Administrator profile — because
  // none of them implies another (docs/adr/0018). A real deployment would split them.
  const membershipId = await ensureMember(companyId, accountId, 'ADMIN', ['ERP', 'FSM']);

  for (const product of PRODUCTS) {
    await linkProfile(
      companyId,
      membershipId,
      product,
      profiles[product].get(SEED_PROFILE_NAMES.ADMINISTRATOR),
    );
  }

  console.log(`  admin account: ${existing ? 'already exists, ensured' : 'created'} (${email})`);
}

interface TestAccountSeed {
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'USER';
  /** `null`: no membership at all. */
  membership: {
    role: MembershipRoleName;
    seats: Product[];
    profiles?: { product: Product; name: string }[];
  } | null;
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
    membership: {
      role: 'MEMBER',
      seats: ['ERP'],
      profiles: [{ product: 'ERP', name: SEED_PROFILE_NAMES.DEFAULT_USER }],
    },
  },
  {
    email: 'no.seat@oliveira.test',
    name: 'Test Member Without Seat',
    role: 'USER',
    membership: { role: 'MEMBER', seats: [] },
  },
];

async function seedTestAccounts(companyId: string, profiles: CompanyProfiles): Promise<void> {
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
        data: { email: seed.email, password: passwordHash, role: seed.role, name: seed.name },
      }));

    if (seed.membership) {
      const membershipId = await ensureMember(
        companyId,
        account.id,
        seed.membership.role,
        seed.membership.seats,
      );

      for (const profile of seed.membership.profiles ?? []) {
        await linkProfile(
          companyId,
          membershipId,
          profile.product,
          profiles[profile.product].get(profile.name),
        );
      }
    }
  }

  console.log(`  test accounts: ${TEST_ACCOUNTS.length} ensured`);
}

async function main() {
  console.log('Seeding…');

  const catalogs = await seedPermissions();
  await seedSystemAccount();
  const companyId = await seedCompany();
  const profiles = await seedReferenceProfiles(catalogs, companyId);
  await seedAdmin(companyId, profiles);
  await seedTestAccounts(companyId, profiles);

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
