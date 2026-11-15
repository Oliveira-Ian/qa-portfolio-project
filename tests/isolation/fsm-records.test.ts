import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { emptyAddressFormValues, emptyEquipmentFormValues } from '@oliveira/schemas';
import { prisma } from '../../apps/api/src/config/prisma.js';
import { catalogItemService } from '../../apps/api/src/modules/fsm/catalog-item/catalog-item.module.js';
import { customerService } from '../../apps/api/src/modules/fsm/customer/customer.module.js';
import { equipmentService } from '../../apps/api/src/modules/fsm/equipment/equipment.module.js';
import { workOrderTypeService } from '../../apps/api/src/modules/fsm/work-order-type/work-order-type.module.js';
import { asCompany, createAdminClient, createBareAppClient } from './helpers';

/**
 * Oliveira FSM's records are company data (docs/adr/0012): another company's
 * customer, equipment, item or type reads as not found, can't be changed, and
 * can't be pointed at — not even an address of another company's customer.
 */

const admin = createAdminClient();
const bare = createBareAppClient(2);

const companyA = { id: '01b00000-0000-7000-8000-0000000000a4', legalName: 'FSM A' };
const companyB = { id: '01b00000-0000-7000-8000-0000000000b4', legalName: 'FSM B' };

const listQuery = { page: 1, pageSize: 50, sortOrder: 'asc' as const };

const customerInput = (name: string) => ({
  name,
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
  addresses: [
    { ...emptyAddressFormValues(true), type: 'SERVICE' as const, label: '', city: 'Recife' },
  ],
  contacts: [],
});

let customerOfB = { id: '', addressId: '' };
let equipmentOfB = '';
let itemOfB = '';
let typeOfB = '';

beforeAll(async () => {
  await admin.company.createMany({ data: [companyA, companyB] });

  await asCompany(companyB.id, async () => {
    const customer = await customerService.create(customerInput('Customer of B'));
    customerOfB = { id: customer.id, addressId: customer.person.addresses[0]!.id };
    equipmentOfB = (
      await equipmentService.create({
        ...emptyEquipmentFormValues,
        customerId: customer.id,
        addressId: customerOfB.addressId,
        name: 'Chiller of B',
      })
    ).id;
    itemOfB = (
      await catalogItemService.create({
        kind: 'SERVICE',
        code: 'S-1',
        name: 'Service of B',
        description: '',
        unit: 'H',
        price: '',
        active: true,
      })
    ).id;
    typeOfB = (
      await workOrderTypeService.create({ name: 'Type of B', description: '', active: true })
    ).id;
  });
});

afterAll(async () => {
  await Promise.all([admin.$disconnect(), bare.$disconnect(), prisma.$disconnect()]);
});

describe('FSM records', () => {
  it("lists none of another company's records", async () => {
    await asCompany(companyA.id, async () => {
      expect((await customerService.list(listQuery, {})).total).toBe(0);
      expect((await equipmentService.list(listQuery, {})).total).toBe(0);
      expect((await catalogItemService.list(listQuery, {})).total).toBe(0);
      expect((await workOrderTypeService.list(listQuery, {})).total).toBe(0);
      expect(await customerService.options(undefined)).toEqual([]);
    });
  });

  it("reads another company's record as not found", async () => {
    await asCompany(companyA.id, async () => {
      await expect(customerService.getById(customerOfB.id)).rejects.toThrow(/not found/i);
      await expect(equipmentService.getById(equipmentOfB)).rejects.toThrow(/not found/i);
      await expect(catalogItemService.getById(itemOfB)).rejects.toThrow(/not found/i);
      await expect(workOrderTypeService.getById(typeOfB)).rejects.toThrow(/not found/i);
    });
  });

  it("neither changes nor deletes another company's records", async () => {
    await asCompany(companyA.id, async () => {
      await expect(
        customerService.update(customerOfB.id, customerInput('Taken over')),
      ).rejects.toThrow();
      await expect(customerService.removeMany([customerOfB.id])).rejects.toThrow();
      await expect(equipmentService.removeMany([equipmentOfB])).rejects.toThrow();
      await expect(catalogItemService.removeMany([itemOfB])).rejects.toThrow();
      await expect(workOrderTypeService.removeMany([typeOfB])).rejects.toThrow();
    });

    expect(await admin.customer.count({ where: { id: customerOfB.id } })).toBe(1);
    expect(
      (await admin.person.findFirstOrThrow({ where: { customer: { id: customerOfB.id } } })).name,
    ).toBe('Customer of B');
    expect(await admin.equipment.count({ where: { id: equipmentOfB } })).toBe(1);
  });

  it("refuses equipment for another company's customer or at its address", async () => {
    await asCompany(companyA.id, async () => {
      await expect(
        equipmentService.create({
          ...emptyEquipmentFormValues,
          customerId: customerOfB.id,
          name: 'Smuggled',
        }),
      ).rejects.toThrow();

      const own = await customerService.create(customerInput('Customer of A'));

      await expect(
        equipmentService.create({
          ...emptyEquipmentFormValues,
          customerId: own.id,
          addressId: customerOfB.addressId,
          name: 'At B',
        }),
      ).rejects.toThrow(/customer's addresses/);
    });
  });

  it('hides every row from the database role without a company', async () => {
    expect(await bare.customer.count()).toBe(0);
    expect(await bare.equipment.count()).toBe(0);
    expect(await bare.catalogItem.count()).toBe(0);
    expect(await bare.workOrderType.count()).toBe(0);
  });
});
