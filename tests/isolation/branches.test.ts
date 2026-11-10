import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../../apps/api/src/config/prisma.js';
import { branchRepository } from '../../apps/api/src/modules/branch/branch.repository.js';
import { ConflictError } from '../../apps/api/src/shared/errors.js';
import { asCompany, createAdminClient } from './helpers';

/** Branches are company data (docs/adr/0013, addendum): codes are unique per company, rows invisible across. */

const admin = createAdminClient();

const companyA = { id: '01b00000-0000-7000-8000-0000000000a2', legalName: 'Branches A' };
const companyB = { id: '01b00000-0000-7000-8000-0000000000b2', legalName: 'Branches B' };

const fields = { street: null, city: null, state: null, zipCode: null, active: true };
let branchOfB = '';

beforeAll(async () => {
  await admin.company.createMany({ data: [companyA, companyB] });
  await admin.branch.create({
    data: { companyId: companyA.id, code: 'HQ', name: 'A head office' },
  });
  branchOfB = (
    await admin.branch.create({
      data: { companyId: companyB.id, code: 'HQ', name: 'B head office' },
    })
  ).id;
});

afterAll(async () => {
  await Promise.all([admin.$disconnect(), prisma.$disconnect()]);
});

describe('branches', () => {
  it("lists only the caller's company's branches", async () => {
    const rows = await asCompany(companyA.id, () => branchRepository.findMany());

    expect(rows.map((row) => row.name)).toEqual(['A head office']);
  });

  it("cannot read or change another company's branch", async () => {
    await asCompany(companyA.id, async () => {
      expect(await branchRepository.findById(branchOfB)).toBeNull();
      await expect(
        branchRepository.update(branchOfB, { code: 'HQ', name: 'taken over', ...fields }),
      ).rejects.toThrow();
    });

    expect((await admin.branch.findUniqueOrThrow({ where: { id: branchOfB } })).name).toBe(
      'B head office',
    );
  });

  it('keeps codes unique within a company only', async () => {
    await expect(
      asCompany(companyA.id, () =>
        branchRepository.create({ code: 'HQ', name: 'Again', ...fields }),
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
