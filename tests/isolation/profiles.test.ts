import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../../apps/api/src/config/prisma.js';
import { getEffectivePermissions } from '../../apps/api/src/modules/auth/permissions.service.js';
import { profileService } from '../../apps/api/src/modules/profile/profile.service.js';
import { BadRequestError, NotFoundError } from '../../apps/api/src/shared/errors.js';
import { asCompany, createAdminClient } from './helpers';

/**
 * Profiles are company data, and each belongs to one product: another
 * company's profiles are invisible, and an ERP profile never holds or grants an
 * FSM permission (docs/adr/0018, docs/adr/0012).
 */

const admin = createAdminClient();

const companyA = { id: '01b00000-0000-7000-8000-0000000000a1', legalName: 'Profiles A' };
const companyB = { id: '01b00000-0000-7000-8000-0000000000b1', legalName: 'Profiles B' };

const ids = {
  erpPermission: 0,
  fsmPermission: 0,
  erpProfileA: 0,
  fsmProfileA: 0,
  erpProfileB: 0,
  membershipA: '',
};

beforeAll(async () => {
  await admin.company.createMany({ data: [companyA, companyB] });

  const erp = await admin.permission.upsert({
    where: { product_resource_action: { product: 'ERP', resource: 'person', action: 'view' } },
    update: {},
    create: { product: 'ERP', resource: 'person', action: 'view' },
  });
  const fsm = await admin.permission.upsert({
    where: {
      product_resource_action: { product: 'FSM', resource: 'work-order', action: 'view' },
    },
    update: {},
    create: { product: 'FSM', resource: 'work-order', action: 'view' },
  });
  ids.erpPermission = erp.id;
  ids.fsmPermission = fsm.id;

  const profile = (companyId: string, product: 'ERP' | 'FSM', permissionId: number) =>
    admin.accessProfile.create({
      data: {
        companyId,
        product,
        name: 'Viewer',
        permissions: { create: [{ permissionId }] },
      },
    });

  ids.erpProfileA = (await profile(companyA.id, 'ERP', erp.id)).id;
  ids.fsmProfileA = (await profile(companyA.id, 'FSM', fsm.id)).id;
  ids.erpProfileB = (await profile(companyB.id, 'ERP', erp.id)).id;

  const account = await admin.accessAccount.create({
    data: { name: 'Profiles member', email: 'profiles.member@oliveira.test', password: 'x' },
  });
  const membership = await admin.membership.create({
    data: { accountId: account.id, companyId: companyA.id },
  });
  ids.membershipA = membership.id;

  await admin.membershipProfile.createMany({
    data: [
      {
        id: crypto.randomUUID(),
        companyId: companyA.id,
        membershipId: membership.id,
        product: 'ERP',
        profileId: ids.erpProfileA,
      },
      {
        id: crypto.randomUUID(),
        companyId: companyA.id,
        membershipId: membership.id,
        product: 'FSM',
        profileId: ids.fsmProfileA,
      },
    ],
  });
});

afterAll(async () => {
  await Promise.all([admin.$disconnect(), prisma.$disconnect()]);
});

describe('profiles are company data', () => {
  it("lists only the caller's company's profiles of that product", async () => {
    const page = await asCompany(companyA.id, () =>
      profileService.list('ERP', { page: 1, pageSize: 50, sortOrder: 'asc' }, {}),
    );

    expect(page.items.map((profile) => profile.id)).toEqual([ids.erpProfileA]);
  });

  it("answers another company's profile, or another product's, as not found", async () => {
    await asCompany(companyA.id, async () => {
      await expect(profileService.getById('ERP', ids.erpProfileB)).rejects.toBeInstanceOf(
        NotFoundError,
      );
      await expect(profileService.getById('ERP', ids.fsmProfileA)).rejects.toBeInstanceOf(
        NotFoundError,
      );
      await expect(profileService.remove('ERP', ids.erpProfileB)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    expect(await admin.accessProfile.count({ where: { id: ids.erpProfileB } })).toBe(1);
  });

  it('refuses a membership link to a profile of another company, even bypassing RLS', async () => {
    await expect(
      admin.membershipProfile.create({
        data: {
          companyId: companyA.id,
          membershipId: ids.membershipA,
          product: 'ERP',
          profileId: ids.erpProfileB,
        },
      }),
    ).rejects.toThrow();
  });
});

describe('products never mix', () => {
  it('refuses to put an FSM permission on an ERP profile', async () => {
    await expect(
      asCompany(companyA.id, () =>
        profileService.create('ERP', {
          name: 'Mixed',
          description: null,
          permissionIds: [ids.erpPermission, ids.fsmPermission],
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('grants each product only its own permissions', async () => {
    const [erp, fsm] = await asCompany(companyA.id, () =>
      Promise.all([
        getEffectivePermissions(ids.membershipA, 'ERP'),
        getEffectivePermissions(ids.membershipA, 'FSM'),
      ]),
    );

    expect([...erp]).toEqual(['person:view']);
    expect([...fsm]).toEqual(['work-order:view']);
  });

  it('duplicates a profile as an ordinary one, in the same product and company', async () => {
    const copy = await asCompany(companyA.id, () =>
      profileService.duplicate('FSM', ids.fsmProfileA),
    );

    expect(copy).toMatchObject({ product: 'FSM', name: 'Viewer (copy)', isSystem: false });
    expect(copy.permissions.map((permission) => permission.id)).toEqual([ids.fsmPermission]);

    const stored = await admin.accessProfile.findUniqueOrThrow({ where: { id: copy.id } });
    expect(stored.companyId).toBe(companyA.id);
  });
});
