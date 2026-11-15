import {
  withOnePrimary,
  type AddressDto,
  type AddressWriteInput,
  type ContactDto,
  type ContactWriteInput,
} from '@oliveira/schemas';
import type { Address, Contact, Prisma } from '../../generated/prisma/client.js';
import type { TransactionClient } from '../../config/prisma.js';

/**
 * Addresses and contact people belong to a record of the company's registry —
 * a Person, a Branch — and are always written as the full set the form shows:
 * existing ones (by id) are updated in place, new ones created, the missing
 * ones removed. Updating in place matters: equipment and work orders point at
 * an address, and keep pointing at it after an edit. One primary per owner,
 * enforced here and by a partial unique index.
 *
 * Runs inside the caller's `withTransaction`, so the owner and its lists are
 * saved together or not at all. The company comes from the caller.
 */

type AddressOwner = { personId: string } | { branchId: string };

const orNull = (value: string | undefined): string | null =>
  value === undefined || value.trim() === '' ? null : value.trim();

/** Primary first, then in the order they were added. */
export const ADDRESS_ORDER: Prisma.AddressOrderByWithRelationInput[] = [
  { isPrimary: 'desc' },
  { createdAt: 'asc' },
];
export const CONTACT_ORDER: Prisma.ContactOrderByWithRelationInput[] = [
  { isPrimary: 'desc' },
  { createdAt: 'asc' },
];

function addressData(input: AddressWriteInput) {
  return {
    type: input.type,
    label: orNull(input.label),
    isPrimary: input.isPrimary,
    zipCode: orNull(input.zipCode),
    street: orNull(input.street),
    number: orNull(input.number),
    complement: orNull(input.complement),
    district: orNull(input.district),
    city: orNull(input.city),
    state: input.state.trim() === '' ? null : input.state.trim().toUpperCase(),
    reference: orNull(input.reference),
    // The FSM's; a product that doesn't send it (the ERP) leaves the stored value as it is.
    ...(input.serviceHours === undefined ? {} : { serviceHours: orNull(input.serviceHours) }),
  };
}

function contactData(input: ContactWriteInput) {
  return {
    name: input.name.trim(),
    role: orNull(input.role),
    email: orNull(input.email),
    phone: orNull(input.phone),
    mobile: orNull(input.mobile),
    isPrimary: input.isPrimary,
    notes: orNull(input.notes),
  };
}

export async function syncAddresses(
  tx: TransactionClient,
  companyId: string,
  owner: AddressOwner,
  items: AddressWriteInput[],
): Promise<void> {
  const wanted = items.length > 0 ? withOnePrimary(items) : [];
  const existing = await tx.address.findMany({ where: owner, select: { id: true } });
  const existingIds = new Set(existing.map((row) => row.id));
  const keptIds = wanted.flatMap((item) => (item.id && existingIds.has(item.id) ? [item.id] : []));

  await tx.address.deleteMany({ where: { ...owner, id: { notIn: keptIds } } });
  // Clear the flag first: switching the primary would otherwise briefly hold two.
  await tx.address.updateMany({ where: owner, data: { isPrimary: false } });

  for (const item of wanted) {
    if (item.id && existingIds.has(item.id)) {
      await tx.address.update({ where: { id: item.id }, data: addressData(item) });
    } else {
      await tx.address.create({ data: { companyId, ...owner, ...addressData(item) } });
    }
  }
}

export async function syncContacts(
  tx: TransactionClient,
  companyId: string,
  personId: string,
  items: ContactWriteInput[],
): Promise<void> {
  const wanted = items.length > 0 ? withOnePrimary(items) : [];
  const existing = await tx.contact.findMany({ where: { personId }, select: { id: true } });
  const existingIds = new Set(existing.map((row) => row.id));
  const keptIds = wanted.flatMap((item) => (item.id && existingIds.has(item.id) ? [item.id] : []));

  // A removed contact stops being any work order's contact on site — the work
  // order keeps everything else.
  await tx.workOrder.updateMany({
    where: { contact: { personId }, contactId: { notIn: keptIds } },
    data: { contactId: null },
  });
  await tx.contact.deleteMany({ where: { personId, id: { notIn: keptIds } } });
  await tx.contact.updateMany({ where: { personId }, data: { isPrimary: false } });

  for (const item of wanted) {
    if (item.id && existingIds.has(item.id)) {
      await tx.contact.update({ where: { id: item.id }, data: contactData(item) });
    } else {
      await tx.contact.create({ data: { companyId, personId, ...contactData(item) } });
    }
  }
}

export function toAddressDto(row: Address): AddressDto {
  return {
    id: row.id,
    type: row.type,
    label: row.label,
    isPrimary: row.isPrimary,
    zipCode: row.zipCode,
    street: row.street,
    number: row.number,
    complement: row.complement,
    district: row.district,
    city: row.city,
    state: row.state,
    reference: row.reference,
    serviceHours: row.serviceHours,
  };
}

export function toContactDto(row: Contact): ContactDto {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    email: row.email,
    phone: row.phone,
    mobile: row.mobile,
    isPrimary: row.isPrimary,
    notes: row.notes,
  };
}
