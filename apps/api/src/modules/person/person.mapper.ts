import type {
  Address,
  Contact,
  Person as PersonRow,
  Prisma,
} from '../../generated/prisma/client.js';
import type { Person, PersonCreateInput } from '@oliveira/schemas';
import { toAddressDto, toContactDto } from '../address/address-sync.js';

/**
 * Create and update write the exact same columns — PUT is a full replace,
 * not a patch. Keeping the mapping here means adding a field can't be done for
 * one operation and forgotten for the other.
 *
 * `active` falls back to true rather than being left alone: that default is
 * part of the documented request body, so omitting it on a PUT does reactivate
 * the record. `documentType`/`document` are only ever null here when the
 * schema-level validation already confirmed `types` doesn't require one — see
 * `personCreateSchema` in packages/schemas. Addresses and contacts are saved
 * separately, as sets (`address-sync.ts`).
 */
/** The company is not part of it: the repository adds the request's own (docs/adr/0012). */
export type PersonWriteData = Omit<Prisma.PersonUncheckedCreateInput, 'companyId'>;

export function toPersonWriteData(input: PersonCreateInput): PersonWriteData {
  return {
    name: input.name,
    tradeName: input.tradeName ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    mobile: input.mobile ?? null,
    birthdate: input.birthdate ?? null,
    documentType: input.documentType ?? null,
    document: input.document ?? null,
    stateRegistration: input.stateRegistration ?? null,
    municipalRegistration: input.municipalRegistration ?? null,
    types: input.types,
    active: input.active ?? true,
    notes: input.notes ?? null,
  };
}

/** A row as the repository reads it: lists bring only the primary address, a record brings both lists. */
export type PersonRowWithRelations = PersonRow & {
  addresses?: Address[];
  contacts?: Contact[];
};

/**
 * Explicit row → wire mapping instead of serializing the Prisma model directly.
 * It pins the response shape (a new column can't leak by accident) and turns
 * the Date columns into the ISO strings clients already receive. `city` and
 * `state` are the primary address's — what a list shows.
 */
export function toPersonDto(row: PersonRowWithRelations, withLists = false): Person {
  const primary = row.addresses?.find((address) => address.isPrimary) ?? row.addresses?.[0];

  return {
    id: row.id,
    name: row.name,
    tradeName: row.tradeName,
    email: row.email,
    phone: row.phone,
    mobile: row.mobile,
    birthdate: row.birthdate ? row.birthdate.toISOString() : null,
    documentType: row.documentType,
    document: row.document,
    stateRegistration: row.stateRegistration,
    municipalRegistration: row.municipalRegistration,
    types: row.types,
    active: row.active,
    city: primary?.city ?? null,
    state: primary?.state ?? null,
    notes: row.notes,
    addresses: withLists ? (row.addresses ?? []).map(toAddressDto) : [],
    contacts: withLists ? (row.contacts ?? []).map(toContactDto) : [],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
