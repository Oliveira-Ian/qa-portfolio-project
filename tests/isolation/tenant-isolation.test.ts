import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma, withTransaction } from '../../apps/api/src/config/prisma.js';
import { TENANT_MODELS, TenantScopeError } from '../../apps/api/src/config/tenant-scope.js';
import { personRepository } from '../../apps/api/src/modules/person/person.repository.js';
import { ConflictError, NotFoundError } from '../../apps/api/src/shared/errors.js';
import { asCompany, createAdminClient, createBareAppClient } from './helpers';

/**
 * docs/adr/0012 § "Required tests": two companies with equivalent data, and
 * every way one could reach the other's rows — through the API's client, with
 * no context, through a failure, concurrently, and with the application layer
 * bypassed entirely.
 */

const admin = createAdminClient();
const bare = createBareAppClient();

const companyA = { id: '01b00000-0000-7000-8000-00000000000a', legalName: 'Isolation A' };
const companyB = { id: '01b00000-0000-7000-8000-00000000000b', legalName: 'Isolation B' };

/** The same document and name in both companies: uniqueness is per company. */
const SHARED_DOCUMENT = '52998224725';
const ROWS_PER_COMPANY = 30;

const personIds: Record<'A' | 'B', string[]> = { A: [], B: [] };

beforeAll(async () => {
  for (const company of [companyA, companyB]) {
    await admin.company.create({ data: company });
  }

  for (const [key, company] of [
    ['A', companyA],
    ['B', companyB],
  ] as const) {
    for (let index = 0; index < ROWS_PER_COMPANY; index += 1) {
      const person = await admin.person.create({
        data: {
          companyId: company.id,
          name: `${company.legalName} person ${index}`,
          types: ['CLIENT'],
          ...(index === 0 ? { documentType: 'CPF', document: SHARED_DOCUMENT } : {}),
        },
      });
      personIds[key].push(person.id);
    }
  }
});

afterAll(async () => {
  await Promise.all([admin.$disconnect(), bare.$disconnect(), prisma.$disconnect()]);
});

describe('through the API client: a company sees only its own rows', () => {
  it('lists and counts only its own people', async () => {
    const rowsA = await asCompany(companyA.id, () =>
      personRepository.findMany({}, [{ createdAt: 'asc' }], 0, 100),
    );
    const countB = await asCompany(companyB.id, () => personRepository.count({}));

    expect(rowsA).toHaveLength(ROWS_PER_COMPANY);
    expect(rowsA.every((row) => row.companyId === companyA.id)).toBe(true);
    expect(countB).toBe(ROWS_PER_COMPANY);
  });

  it("answers another company's id as not found, on read, update and delete", async () => {
    const otherId = personIds.B[1]!;

    await asCompany(companyA.id, async () => {
      expect(await personRepository.findById(otherId)).toBeNull();
      await expect(
        personRepository.update(otherId, { name: 'taken over', types: ['CLIENT'] }),
      ).rejects.toBeInstanceOf(NotFoundError);
      await expect(personRepository.delete(otherId)).rejects.toBeInstanceOf(NotFoundError);
    });

    const untouched = await admin.person.findUniqueOrThrow({ where: { id: otherId } });
    expect(untouched.name).toBe(`${companyB.legalName} person 1`);
  });

  it("rolls back a bulk delete that includes another company's id", async () => {
    const ownId = personIds.A[2]!;

    await expect(
      asCompany(companyA.id, () => personRepository.deleteMany([ownId, personIds.B[2]!])),
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(await admin.person.count({ where: { id: { in: [ownId, personIds.B[2]!] } } })).toBe(2);
  });

  it('summarises only its own registry', async () => {
    const summary = await asCompany(companyB.id, () => personRepository.summary());

    expect(summary.total).toBe(ROWS_PER_COMPANY);
    expect(summary.recent.every((row) => row.companyId === companyB.id)).toBe(true);
  });

  it('keeps documents unique per company, not across companies', async () => {
    await expect(
      asCompany(companyA.id, () =>
        personRepository.create({
          name: 'duplicate',
          types: ['CLIENT'],
          documentType: 'CPF',
          document: SHARED_DOCUMENT,
        }),
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('writes the request’s company and refuses one smuggled into the data', async () => {
    const created = await asCompany(companyA.id, () =>
      personRepository.create({ name: 'written by A', types: ['CLIENT'] }),
    );
    expect(created.companyId).toBe(companyA.id);

    await expect(
      asCompany(companyA.id, () =>
        prisma.person.create({
          data: { companyId: companyB.id, name: 'forged', types: ['CLIENT'] },
        }),
      ),
    ).rejects.toBeInstanceOf(TenantScopeError);

    await expect(
      asCompany(companyA.id, () =>
        prisma.person.updateMany({ where: {}, data: { companyId: companyB.id } }),
      ),
    ).rejects.toBeInstanceOf(TenantScopeError);
  });
});

describe('with no company in the context', () => {
  it('refuses to run a company-scoped query instead of running it unscoped', async () => {
    await expect(asCompany(undefined, () => prisma.person.findMany())).rejects.toThrow(
      /needs a company/,
    );
    await expect(asCompany(undefined, () => prisma.person.count())).rejects.toThrow(
      /needs a company/,
    );
  });

  it('sees nothing and inserts nothing at the database, even with the application layer skipped', async () => {
    expect(await bare.person.count()).toBe(0);
    await expect(
      bare.person.create({ data: { companyId: companyA.id, name: 'no setting', types: [] } }),
    ).rejects.toThrow();
  });
});

describe('failure paths leave nothing behind', () => {
  it('rolls back a unit of work that fails half-way', async () => {
    await expect(
      asCompany(companyA.id, () =>
        withTransaction(async (tx) => {
          await tx.person.create({
            data: { companyId: companyA.id, name: 'rolled back', types: [] },
          });
          throw new Error('mid-request failure');
        }),
      ),
    ).rejects.toThrow('mid-request failure');

    expect(await admin.person.count({ where: { name: 'rolled back' } })).toBe(0);
  });

  it('does not let the next user of a pooled connection inherit the company', async () => {
    // One connection, so every statement below reuses the same one.
    const single = createBareAppClient(1);

    try {
      await single.$transaction([
        single.$executeRaw`SELECT set_config('app.current_company_id', ${companyA.id}, true)`,
        single.person.count(),
      ]);
      await expect(
        single.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT set_config('app.current_company_id', ${companyA.id}, true)`;
          throw new Error('boom');
        }),
      ).rejects.toThrow('boom');

      const [after] = await single.$queryRaw<{ rows: bigint; setting: string | null }[]>`
        SELECT count(*) AS rows, current_setting('app.current_company_id', true) AS setting
        FROM "Person"`;

      expect(Number(after!.rows)).toBe(0);
      expect(after!.setting ?? '').toBe('');
    } finally {
      await single.$disconnect();
    }
  });
});

describe('concurrent requests for different companies', () => {
  it('never see each other’s rows when interleaved over the pool', async () => {
    const requests = Array.from({ length: 120 }, (_, index) => {
      const company = index % 2 === 0 ? companyA : companyB;

      return asCompany(company.id, async () => {
        const rows =
          index % 3 === 0
            ? await withTransaction(async (tx) => {
                await new Promise((resolve) => setTimeout(resolve, index % 7));
                return tx.person.findMany({ take: 10 });
              })
            : await personRepository.findMany({}, [{ name: 'asc' }], index % 10, 10);

        return rows.every((row) => row.companyId === company.id);
      });
    });

    expect((await Promise.all(requests)).every(Boolean)).toBe(true);
  });
});

describe('the database layer on its own', () => {
  it("blocks raw SQL from reading or writing another company's rows", async () => {
    const [, rows] = await bare.$transaction([
      bare.$executeRaw`SELECT set_config('app.current_company_id', ${companyA.id}, true)`,
      bare.$queryRaw<{ companyId: string }[]>`SELECT "companyId" FROM "Person"`,
    ]);

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.companyId === companyA.id)).toBe(true);

    await expect(
      bare.$transaction([
        bare.$executeRaw`SELECT set_config('app.current_company_id', ${companyA.id}, true)`,
        bare.$executeRaw`INSERT INTO "Person" ("id", "companyId", "name", "types", "updatedAt")
          VALUES (gen_random_uuid()::text, ${companyB.id}, 'raw cross insert', '{}', now())`,
      ]),
    ).rejects.toThrow(/row-level security/i);
  });

  it('refuses a membership that points at a person of another company, even bypassing RLS', async () => {
    const account = await admin.accessAccount.create({
      data: { name: 'Isolation FK', email: 'isolation.fk@oliveira.test', password: 'x' },
    });

    await expect(
      admin.membership.create({
        data: { accountId: account.id, companyId: companyA.id, personId: personIds.B[3]! },
      }),
    ).rejects.toThrow();
  });
});

describe('the application role cannot turn isolation off', () => {
  it('is neither a superuser nor exempt from RLS', async () => {
    const [role] = await bare.$queryRaw<{ rolsuper: boolean; rolbypassrls: boolean }[]>`
      SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user`;

    expect(role).toEqual({ rolsuper: false, rolbypassrls: false });
  });

  it.each([
    'ALTER TABLE "Person" DISABLE ROW LEVEL SECURITY',
    'ALTER TABLE "Person" NO FORCE ROW LEVEL SECURITY',
    'DROP POLICY company_isolation ON "Person"',
  ])('cannot run: %s', async (statement) => {
    await expect(bare.$executeRawUnsafe(statement)).rejects.toThrow(/owner/);
  });

  it('cannot read with row_security off', async () => {
    await expect(
      bare.$transaction([
        bare.$executeRawUnsafe('SET LOCAL row_security = off'),
        bare.$queryRawUnsafe('SELECT count(*) FROM "Person"'),
      ]),
    ).rejects.toThrow(/row-level security/i);
  });
});

describe('every company-scoped table is under a forced policy', () => {
  /**
   * Tables that carry a company id but are Platform data read before a company
   * is chosen (sign-in, `requireAuth`) — scoped by explicit filters in their
   * repositories instead (docs/adr/0012, "Some tables are not company-scoped").
   */
  const PLATFORM_TABLES_WITH_COMPANY = new Set(['Membership', 'CompanyProduct']);

  it('has RLS enabled and forced, with the company policy, on each of them', async () => {
    const tables = await admin.$queryRaw<
      { table: string; enabled: boolean; forced: boolean; policies: bigint }[]
    >`
      SELECT c.relname AS "table", c.relrowsecurity AS enabled, c.relforcerowsecurity AS forced,
             (SELECT count(*) FROM pg_policies p
               WHERE p.tablename = c.relname AND p.policyname = 'company_isolation') AS policies
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
      WHERE c.relkind = 'r'
        AND EXISTS (SELECT 1 FROM information_schema.columns col
                     WHERE col.table_schema = 'public' AND col.table_name = c.relname
                       AND col.column_name = 'companyId')`;

    const scoped = tables.filter((table) => !PLATFORM_TABLES_WITH_COMPANY.has(table.table));

    for (const table of scoped) {
      expect({ ...table, policies: Number(table.policies) }).toEqual({
        table: table.table,
        enabled: true,
        forced: true,
        policies: 1,
      });
    }

    // The application layer and the database agree on which models are scoped.
    expect(new Set(scoped.map((table) => table.table))).toEqual(new Set(TENANT_MODELS));
  });
});
