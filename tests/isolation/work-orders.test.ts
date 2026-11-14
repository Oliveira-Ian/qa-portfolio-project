import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { emptyAddressFormValues } from '@oliveira/schemas';
import { prisma } from '../../apps/api/src/config/prisma.js';
import { customerService } from '../../apps/api/src/modules/fsm/customer/customer.module.js';
import {
  workOrderService,
  type WorkOrderCaller,
} from '../../apps/api/src/modules/fsm/work-order/work-order.service.js';
import { workOrderTypeService } from '../../apps/api/src/modules/fsm/work-order-type/work-order-type.module.js';
import { asCompany, createAdminClient, createBareAppClient } from './helpers';

/**
 * Work orders are company data (docs/adr/0012), numbered per company, and a
 * technician sees only the ones assigned to them — another's reads as not
 * found, the same answer as another company's.
 */

const admin = createAdminClient();
const bare = createBareAppClient(2);

const companyA = { id: '01b00000-0000-7000-8000-0000000000a5', legalName: 'WO A' };
const companyB = { id: '01b00000-0000-7000-8000-0000000000b5', legalName: 'WO B' };

const listQuery = { page: 1, pageSize: 50, sortOrder: 'asc' as const };

const manager = (membershipId: string | null = null): WorkOrderCaller => ({
  accountId: 1,
  name: 'Manager',
  membershipId,
  can: {
    view: true,
    create: true,
    edit: true,
    assign: true,
    changeStatus: true,
    execute: false,
  },
});

const technician = (membershipId: string): WorkOrderCaller => ({
  accountId: 1,
  name: 'Technician',
  membershipId,
  can: {
    view: false,
    create: false,
    edit: false,
    assign: false,
    changeStatus: false,
    execute: true,
  },
});

const values = (customerId: string, typeId: string) => ({
  customerId,
  equipmentId: '',
  serviceAddressId: '',
  typeId,
  branchId: '',
  title: 'Job',
  description: '',
  priority: 'NORMAL' as const,
  assigneeMembershipId: '',
  scheduledAt: '',
  dueAt: '',
});

async function seedCompany(companyId: string) {
  return asCompany(companyId, async () => {
    const customer = await customerService.create({
      name: 'Customer',
      documentType: null,
      document: null,
      tradeName: null,
      stateRegistration: null,
      municipalRegistration: null,
      email: null,
      phone: null,
      mobile: null,
      birthdate: null,
      active: true,
      notes: null,
      addresses: [{ ...emptyAddressFormValues(true), type: 'SERVICE' as const, label: '' }],
      contacts: [],
    });
    const type = await workOrderTypeService.create({
      name: 'Visit',
      description: '',
      active: true,
    });

    return { customerId: customer.id, typeId: type.id };
  });
}

let ofA = { customerId: '', typeId: '' };
let workOrderOfB = '';
let numberOfB = 0;

beforeAll(async () => {
  await admin.company.createMany({ data: [companyA, companyB] });
  ofA = await seedCompany(companyA.id);
  const ofB = await seedCompany(companyB.id);

  const created = await asCompany(companyB.id, () =>
    workOrderService.create(values(ofB.customerId, ofB.typeId), 180, manager()),
  );
  workOrderOfB = created.id;
  numberOfB = created.number;
});

afterAll(async () => {
  await Promise.all([admin.$disconnect(), bare.$disconnect(), prisma.$disconnect()]);
});

describe('work orders', () => {
  it('numbers each company from 1', async () => {
    const first = await asCompany(companyA.id, () =>
      workOrderService.create(values(ofA.customerId, ofA.typeId), 180, manager()),
    );

    expect(first.number).toBe(1);
    expect(numberOfB).toBe(1);
  });

  it("neither lists, reads nor changes another company's work orders", async () => {
    await asCompany(companyA.id, async () => {
      const listed = await workOrderService.list(listQuery, {}, manager());
      expect(listed.items.some((item) => item.id === workOrderOfB)).toBe(false);

      await expect(workOrderService.getById(workOrderOfB, manager())).rejects.toThrow(/not found/i);
      await expect(
        workOrderService.changeStatus(workOrderOfB, { to: 'CANCELLED', reason: 'x' }, manager()),
      ).rejects.toThrow(/not found/i);
      await expect(workOrderService.addNote(workOrderOfB, 'hi', manager())).rejects.toThrow(
        /not found/i,
      );
    });

    expect((await admin.workOrder.findUniqueOrThrow({ where: { id: workOrderOfB } })).status).toBe(
      'OPEN',
    );
  });

  it("refuses another company's customer on a work order", async () => {
    const customerOfB = await admin.customer.findFirstOrThrow({
      where: { companyId: companyB.id },
    });

    await expect(
      asCompany(companyA.id, () =>
        workOrderService.create(values(customerOfB.id, ofA.typeId), 180, manager()),
      ),
    ).rejects.toThrow(/customer not found/i);
  });

  it('shows a technician only the work orders assigned to them', async () => {
    const someoneElse = '01b00000-0000-7000-8000-00000000ffff';
    const own = await asCompany(companyA.id, () =>
      workOrderService.create(
        { ...values(ofA.customerId, ofA.typeId), title: 'Not theirs' },
        180,
        manager(),
      ),
    );

    await asCompany(companyA.id, async () => {
      const listed = await workOrderService.list(listQuery, {}, technician(someoneElse));
      expect(listed.total).toBe(0);
      await expect(workOrderService.getById(own.id, technician(someoneElse))).rejects.toThrow(
        /not found/i,
      );
    });
  });

  it('hides every row from the database role without a company', async () => {
    expect(await bare.workOrder.count()).toBe(0);
    expect(await bare.workOrderEvent.count()).toBe(0);
    expect(await bare.fsmCounter.count()).toBe(0);
  });
});
