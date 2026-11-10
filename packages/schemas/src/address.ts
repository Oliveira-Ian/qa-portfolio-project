import { z } from 'zod';
import { maxLengthMessage } from './messages.js';

/**
 * Addresses of the company's registry (plan § 2.9, the essential of F-14): a
 * person or a branch has any number, each typed, one of them primary. For the
 * FSM an address is also a **service location** — equipment is installed at
 * one and a work order is carried out at one — so a customer with several sites
 * has several addresses.
 */
export const ADDRESS_TYPES = [
  'COMMERCIAL',
  'RESIDENTIAL',
  'BILLING',
  'SERVICE',
  'DELIVERY',
  'OTHER',
] as const;

export const addressTypeSchema = z.enum(ADDRESS_TYPES);
export type AddressType = z.infer<typeof addressTypeSchema>;

const text = (max: number) => z.string().trim().max(max, maxLengthMessage(max));

/**
 * One address in a write (the form and the API share it). `id` is present for
 * an address that already exists — it is updated in place, so the equipment
 * and work orders that point at it keep pointing at it — and absent for a new
 * one. Empty text is `''`; the API stores it as `null`.
 */
export const addressWriteSchema = z.object({
  id: z.string().optional(),
  type: addressTypeSchema,
  label: text(80),
  isPrimary: z.boolean(),
  zipCode: text(9),
  street: text(160),
  number: text(20),
  complement: text(80),
  district: text(80),
  city: text(80),
  state: text(2),
  /** "Next to the bakery", "gate 3" — for whoever drives there. */
  reference: text(160),
});

export type AddressWriteInput = z.infer<typeof addressWriteSchema>;
export type AddressFormValues = z.input<typeof addressWriteSchema>;

export interface AddressDto {
  id: string;
  type: AddressType;
  label: string | null;
  isPrimary: boolean;
  zipCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  reference: string | null;
}

export function emptyAddressFormValues(isPrimary = false): AddressFormValues {
  return {
    type: 'COMMERCIAL',
    label: '',
    isPrimary,
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    district: '',
    city: '',
    state: '',
    reference: '',
  };
}

export function addressToFormValues(address: AddressDto): AddressFormValues {
  return {
    id: address.id,
    type: address.type,
    label: address.label ?? '',
    isPrimary: address.isPrimary,
    zipCode: address.zipCode ?? '',
    street: address.street ?? '',
    number: address.number ?? '',
    complement: address.complement ?? '',
    district: address.district ?? '',
    city: address.city ?? '',
    state: address.state ?? '',
    reference: address.reference ?? '',
  };
}

/** "Rua X, 100 — Sala 2 · Centro · São Paulo/SP · 01310-100", leaving out whatever is empty. */
export function formatAddress(
  address: Pick<
    AddressDto,
    'street' | 'number' | 'complement' | 'district' | 'city' | 'state' | 'zipCode'
  >,
): string {
  const street = [address.street, address.number].filter(Boolean).join(', ');
  const line = [street, address.complement].filter(Boolean).join(' — ');
  const place = [address.city, address.state].filter(Boolean).join('/');

  return [line, address.district, place, address.zipCode].filter(Boolean).join(' · ');
}

/**
 * Keeps exactly one primary address: the one marked, or the first when none
 * (or several) are. Applied by the API before saving, so the rule never
 * depends on the form.
 */
export function withOnePrimary<T extends { isPrimary: boolean }>(items: T[]): T[] {
  const primaryIndex = Math.max(
    items.findIndex((item) => item.isPrimary),
    0,
  );

  return items.map((item, index) => ({ ...item, isPrimary: index === primaryIndex }));
}
