import type { Person as PersonRow, Prisma } from '@prisma/client';
import type { Person, PersonCreateInput } from '@oliveira/schemas';

/**
 * Create and update write the exact same columns — PUT is a full replace,
 * not a patch. Keeping the mapping here means adding a field can't be done for
 * one operation and forgotten for the other.
 *
 * `active` falls back to true rather than being left alone: that default is
 * part of the documented request body, so omitting it on a PUT does reactivate
 * the record. `documentType`/`document` are only ever null here when the
 * schema-level validation already confirmed `types` doesn't require one — see
 * `personCreateSchema` in packages/schemas.
 */
export function toPersonWriteData(input: PersonCreateInput): Prisma.PersonCreateInput {
  return {
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    birthdate: input.birthdate ?? null,
    documentType: input.documentType ?? null,
    document: input.document ?? null,
    types: input.types,
    active: input.active ?? true,
    street: input.street ?? null,
    city: input.city ?? null,
    state: input.state ?? null,
    zipCode: input.zipCode ?? null,
    notes: input.notes ?? null,
  };
}

/**
 * Explicit row → wire mapping instead of serializing the Prisma model directly.
 * It pins the response shape (a new column can't leak by accident) and turns
 * the Date columns into the ISO strings clients already receive.
 */
export function toPersonDto(row: PersonRow): Person {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    birthdate: row.birthdate ? row.birthdate.toISOString() : null,
    documentType: row.documentType,
    document: row.document,
    types: row.types,
    active: row.active,
    street: row.street,
    city: row.city,
    state: row.state,
    zipCode: row.zipCode,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
