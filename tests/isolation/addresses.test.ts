import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { emptyAddressFormValues, emptyContactFormValues } from '@oliveira/schemas';
import { prisma } from '../../apps/api/src/config/prisma.js';
import { personRepository } from '../../apps/api/src/modules/person/person.repository.js';
import { asCompany, createAdminClient, createBareAppClient } from './helpers';

/**
 * Addresses and contacts are company data (plan § 2.9): invisible across
 * companies, written with their person in one transaction, one primary each,
 * and updated in place so what points at an address keeps pointing at it.
 */

const admin = createAdminClient();
const bare = createBareAppClient(2);

const companyA = { id: '01b00000-0000-7000-8000-0000000000a3', legalName: 'Addresses A' };
const companyB = { id: '01b00000-0000-7000-8000-0000000000b3', legalName: 'Addresses B' };

const person = {
  name: 'Customer',
  tradeName: null,
  email: null,
  phone: null,
  mobile: null,
  birthdate: null,
  documentType: null,
  document: null,
  stateRegistration: null,
  municipalRegistration: null,
  types: ['EMPLOYEE' as const],
  active: true,
  notes: null,
};

const address = (city: string, isPrimary = false) => ({
  ...emptyAddressFormValues(isPrimary),
  type: 'COMMERCIAL' as const,
  label: '',
  city,
});
const contact = (name: string, isPrimary = false) => ({
  ...emptyContactFormValues(isPrimary),
  name,
});

let personOfB = '';

beforeAll(async () => {
  await admin.company.createMany({ data: [companyA, companyB] });
  personOfB = (
    await asCompany(companyB.id, () =>
      personRepository.create(person, {
        addresses: [address('Recife', true)],
        contacts: [contact('Bia')],
      }),
    )
  ).id;
});

afterAll(async () => {
  await Promise.all([admin.$disconnect(), bare.$disconnect(), prisma.$disconnect()]);
});

describe('addresses and contacts', () => {
  it('saves a person with its lists, keeping exactly one primary', async () => {
    const row = await asCompany(companyA.id, () =>
      personRepository.create(person, {
        addresses: [address('Santos', true), address('Campinas', true)],
        contacts: [contact('Ana'), contact('Caio')],
      }),
    );

    expect(row.addresses?.map((item) => [item.city, item.isPrimary])).toEqual([
      ['Santos', true],
      ['Campinas', false],
    ]);
    expect(row.contacts?.filter((item) => item.isPrimary).map((item) => item.name)).toEqual([
      'Ana',
    ]);
  });

  it('updates an address in place and switches the primary', async () => {
    const created = await asCompany(companyA.id, () =>
      personRepository.create(person, {
        addresses: [address('Santos', true), address('Campinas')],
        contacts: [],
      }),
    );
    const [first, second] = created.addresses ?? [];

    const updated = await asCompany(companyA.id, () =>
      personRepository.update(created.id, person, {
        addresses: [
          { ...address('Santos'), id: first!.id },
          { ...address('Sorocaba', true), id: second!.id },
        ],
        contacts: [],
      }),
    );

    expect(updated.addresses?.map((item) => [item.id, item.city, item.isPrimary])).toEqual([
      [second!.id, 'Sorocaba', true],
      [first!.id, 'Santos', false],
    ]);
  });

  it("never lists, reads or rewrites another company's addresses and contacts", async () => {
    const seenByA = await asCompany(companyA.id, () =>
      prisma.address.findMany({ where: { personId: personOfB } }),
    );
    expect(seenByA).toEqual([]);

    await expect(
      asCompany(companyA.id, () =>
        personRepository.update(personOfB, person, { addresses: [], contacts: [] }),
      ),
    ).rejects.toThrow();

    expect(await admin.address.count({ where: { personId: personOfB } })).toBe(1);
    expect(await admin.contact.count({ where: { personId: personOfB } })).toBe(1);
  });

  it('cannot attach an address of company A to a person of company B', async () => {
    await expect(
      asCompany(companyA.id, () =>
        prisma.address.create({
          data: { companyId: companyA.id, personId: personOfB, city: 'Nowhere' },
        }),
      ),
    ).rejects.toThrow();
  });

  it('hides every row from the database role without a company', async () => {
    expect(await bare.address.count()).toBe(0);
    expect(await bare.contact.count()).toBe(0);
  });
});
