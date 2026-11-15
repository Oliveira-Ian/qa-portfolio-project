import { z } from 'zod';
import { isValidEmail } from './email.js';
import { addressToFormValues, addressWriteSchema, type AddressDto } from './address.js';
import { contactToFormValues, contactWriteSchema, type ContactDto } from './contact.js';
import { maxLengthMessage } from './messages.js';
import { paginationQuerySchema, sortQuerySchema } from './pagination.js';

/** Optional text in the API's write: `null` or a string within `max`. */
const optionalText = (max: number) =>
  z.string().trim().max(max, maxLengthMessage(max)).nullable().optional();

/**
 * A Person can hold more than one role at once — a company can be a client
 * and a supplier at the same time, and USER marks a person that has an
 * AccessAccount. This is the "Party Role" pattern: identity is one record,
 * roles are a set on it, not a single value forcing duplicate records.
 */
export const personTypeValueSchema = z.enum(['CLIENT', 'SUPPLIER', 'USER', 'EMPLOYEE']);
export const documentTypeSchema = z.enum(['CPF', 'CNPJ']);

const documentLengthByType: Record<z.infer<typeof documentTypeSchema>, number> = {
  CPF: 11,
  CNPJ: 14,
};

/** Types that make a document a business requirement, not merely optional. */
const DOCUMENT_REQUIRING_TYPES = new Set<z.infer<typeof personTypeValueSchema>>([
  'CLIENT',
  'SUPPLIER',
]);

/**
 * Exported so `apps/web`'s form can show/hide the document fields with the
 * exact same rule that decides whether they're validated and persisted —
 * a UI-only copy of this condition would drift from the schema silently.
 */
export function requiresDocument(types: readonly z.infer<typeof personTypeValueSchema>[]): boolean {
  return types.some((type) => DOCUMENT_REQUIRING_TYPES.has(type));
}

// Missing (undefined/null) required text fields must fail with the same
// friendly message as an empty string — plain .min(1) alone only catches
// the empty-string case and falls back to a generic type error otherwise.
const requiredText = (message: string) =>
  z.preprocess(
    (value) => (value === undefined || value === null ? '' : value),
    z.string().trim().min(1, message),
  );

/**
 * `document`/`documentType` are only required when `types` includes CLIENT or
 * SUPPLIER — a person who is only a USER (an employee's login, say) shouldn't
 * need a CPF to exist in the system. The two `.superRefine` checks run only
 * once the base shape parses, so a person with no type at all still reports
 * "At least one type is required" rather than a confusing document error.
 */
/**
 * The document rule, shared by every write of a person: when one is given it
 * needs its type and the right number of digits; `required` says whether an
 * empty one is an error too (the ERP's CLIENT and SUPPLIER).
 */
function checkDocument(
  data: { document?: string | null | undefined; documentType?: DocumentType | null | undefined },
  ctx: z.RefinementCtx,
  required: boolean,
): void {
  const document = data.document?.trim() ?? '';

  if (document === '') {
    if (required) {
      ctx.addIssue({ code: 'custom', message: 'Document is required', path: ['document'] });
    }
    return;
  }

  if (!data.documentType) {
    ctx.addIssue({ code: 'custom', message: 'Document type is required', path: ['documentType'] });
    return;
  }

  if (document.replace(/\D/g, '').length !== documentLengthByType[data.documentType]) {
    ctx.addIssue({ code: 'custom', message: 'Invalid document format', path: ['document'] });
  }
}

/** Every field of a person's write except the ERP's `types` — what the FSM's customer writes too. */
const personWriteShape = {
  name: requiredText('Name is required'),
  documentType: documentTypeSchema.nullable().optional(),
  document: z.string().trim().nullable().optional(),
  tradeName: optionalText(160),
  stateRegistration: optionalText(20),
  municipalRegistration: optionalText(20),
  email: z.string().trim().email('Invalid email').nullable().optional(),
  phone: optionalText(20),
  mobile: optionalText(20),
  birthdate: z.coerce.date({ error: 'Invalid birth date' }).nullable().optional(),
  active: z.boolean().optional(),
  notes: z.string().trim().nullable().optional(),
  /** Every address of the record — sent in full, the API syncs the set. */
  addresses: z.array(addressWriteSchema).default([]),
  /** Every contact person of the record — sent in full, like `addresses`. */
  contacts: z.array(contactWriteSchema).default([]),
};

export const personCreateSchema = z
  .object({
    ...personWriteShape,
    types: z.array(personTypeValueSchema).min(1, 'At least one type is required'),
  })
  .superRefine((data, ctx) => {
    if (requiresDocument(data.types)) {
      checkDocument(data, ctx, true);
    }
  });

/**
 * An FSM customer's person (docs/adr/0019): the same record, written without
 * the ERP's `types` — a product never extends that classification. The
 * document is optional, and checked when given.
 */
export const customerPersonWriteSchema = z
  .object(personWriteShape)
  .superRefine((data, ctx) => checkDocument(data, ctx, false));

export type CustomerPersonWriteInput = z.infer<typeof customerPersonWriteSchema>;

// PUT is a full replace, not a patch (docs/api/http_responses.md documents the
// same body for POST and PUT). It also cannot be `.partial()`: the
// `.superRefine()` above turns the object into a ZodEffects, which has no
// `.partial()`.
export const personUpdateSchema = personCreateSchema;

export type PersonCreateInput = z.infer<typeof personCreateSchema>;
export type PersonUpdateInput = z.infer<typeof personUpdateSchema>;
export type PersonTypeValue = z.infer<typeof personTypeValueSchema>;
export type DocumentType = z.infer<typeof documentTypeSchema>;

/** Body of `DELETE /api/persons` — deletes every id in one transaction, all-or-nothing. */
export const personDeleteManySchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one id is required'),
});

export type PersonDeleteManyInput = z.infer<typeof personDeleteManySchema>;

/**
 * Filters accepted by `GET /api/persons`.
 *
 * `type` stays singular in the query string — it answers "persons who hold
 * this role", filtered via Prisma's `has` on the `types` array — even though
 * the field it filters is now plural on the model.
 *
 * `active` keeps the legacy semantics on purpose — only the literal string
 * `'true'` means true, anything else means false — so the query behaves exactly
 * as it did before it was typed.
 */
export const personQuerySchema = z.object({
  type: personTypeValueSchema.optional(),
  active: z
    .string()
    .transform((value) => value === 'true')
    .optional(),
  search: z.string().trim().optional(),
});

export type PersonQuery = z.infer<typeof personQuerySchema>;

/**
 * `GET /api/persons`'s full query contract: the legacy `type`/`active`/
 * `search` filters above, plus pagination and sorting. Per-column quick
 * filters (`f_name`, `f_active`, …) are deliberately not part of this
 * schema — their key set is dynamic (one column, one entity, at a time),
 * which doesn't fit a fixed Zod object shape; `apps/api/src/shared/list-query.ts`
 * parses those directly off the raw query object instead, against a
 * per-entity field map that's the real whitelist of what's accepted.
 */
export const personListQuerySchema = personQuerySchema
  .extend(paginationQuerySchema.shape)
  .extend(sortQuerySchema.shape);

export type PersonListQuery = z.infer<typeof personListQuerySchema>;

/* -------------------------------------------------------------------------- */
/* Form values                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * What the UI actually holds: every field is a string, because that is what an
 * `<input>` gives you — except `types`, which comes from a group of checkboxes
 * and is naturally an array already. Keeping this separate from
 * `personCreateSchema` is what lets the form report *all* of its problems at
 * once while the API still answers with a single message.
 *
 * The `.superRefine` only runs once the object itself parses, which is exactly
 * the behaviour we want: an empty document on a CLIENT reads "Document is
 * required", and a short one reads "Invalid document format".
 */
const personFormShape = {
  name: z.string().trim().min(1, 'Name is required'),
  tradeName: z.string().trim().max(160, maxLengthMessage(160)),
  types: z.array(personTypeValueSchema).min(1, 'At least one type is required'),
  documentType: documentTypeSchema.nullable(),
  document: z.string().trim(),
  stateRegistration: z.string().trim().max(20, maxLengthMessage(20)),
  municipalRegistration: z.string().trim().max(20, maxLengthMessage(20)),
  email: z.string().trim(),
  phone: z.string().trim(),
  mobile: z.string().trim(),
  birthdate: z.string(),
  active: z.boolean(),
  notes: z.string().trim(),
  addresses: z.array(addressWriteSchema),
  contacts: z.array(contactWriteSchema),
};

function checkEmail(data: { email: string }, ctx: z.RefinementCtx): void {
  if (data.email !== '' && !isValidEmail(data.email)) {
    ctx.addIssue({ code: 'custom', message: 'Invalid email', path: ['email'] });
  }
}

export const personFormSchema = z.object(personFormShape).superRefine((data, ctx) => {
  checkEmail(data, ctx);

  if (requiresDocument(data.types)) {
    checkDocument(data, ctx, true);
  }
});

/**
 * The FSM customer's form: the person's form values (one shape, one field
 * layout), with `types` left alone and the document optional.
 */
export const customerFormSchema = z
  .object({ ...personFormShape, types: z.array(personTypeValueSchema) })
  .superRefine((data, ctx) => {
    checkEmail(data, ctx);
    checkDocument(data, ctx, false);
  });

export type PersonFormValues = z.infer<typeof personFormSchema>;

export const emptyPersonFormValues: PersonFormValues = {
  name: '',
  tradeName: '',
  types: [],
  documentType: null,
  document: '',
  stateRegistration: '',
  municipalRegistration: '',
  email: '',
  phone: '',
  mobile: '',
  birthdate: '',
  active: true,
  notes: '',
  addresses: [],
  contacts: [],
};

/** Wire record → form values. An absent field is an empty string, never null. */
export function personToFormValues(person: Person): PersonFormValues {
  return {
    name: person.name,
    tradeName: person.tradeName ?? '',
    types: person.types,
    documentType: person.documentType,
    document: person.document ?? '',
    stateRegistration: person.stateRegistration ?? '',
    municipalRegistration: person.municipalRegistration ?? '',
    email: person.email ?? '',
    phone: person.phone ?? '',
    mobile: person.mobile ?? '',
    // `<input type="date">` wants the calendar day, not the instant.
    birthdate: person.birthdate ? person.birthdate.slice(0, 10) : '',
    active: person.active,
    notes: person.notes ?? '',
    addresses: person.addresses.map(addressToFormValues),
    contacts: person.contacts.map(contactToFormValues),
  };
}

/** Form values → request body. Blank optional fields become null, not "". */
export function personFormValuesToPayload(values: PersonFormValues): PersonCreateInput {
  const orNull = (value: string) => (value.trim() === '' ? null : value.trim());

  return {
    name: values.name.trim(),
    types: values.types,
    documentType: requiresDocument(values.types) ? values.documentType : null,
    document: requiresDocument(values.types) ? orNull(values.document) : null,
    tradeName: orNull(values.tradeName),
    stateRegistration: orNull(values.stateRegistration),
    municipalRegistration: orNull(values.municipalRegistration),
    email: orNull(values.email),
    phone: orNull(values.phone),
    mobile: orNull(values.mobile),
    birthdate: values.birthdate ? new Date(values.birthdate) : null,
    active: values.active,
    notes: orNull(values.notes),
    addresses: values.addresses.map((address) => addressWriteSchema.parse(address)),
    contacts: values.contacts.map((contact) => contactWriteSchema.parse(contact)),
  };
}

/** Form values → an FSM customer's person: no `types`, the document kept whenever it was typed. */
export function customerFormValuesToPayload(values: PersonFormValues): CustomerPersonWriteInput {
  // `CLIENT` only so the document is kept whenever it was typed; `types` itself is dropped.
  const payload: Partial<PersonCreateInput> = personFormValuesToPayload({
    ...values,
    types: ['CLIENT'],
  });
  delete payload.types;

  return payload as CustomerPersonWriteInput;
}

/**
 * A Person as it crosses the wire: dates already serialized to ISO strings.
 * Derived from the create schema so a new field can't be added to one without
 * the other, and shared by `apps/api` and `apps/web`.
 */
export interface Person {
  id: string;
  name: string;
  tradeName: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  birthdate: string | null;
  types: PersonTypeValue[];
  documentType: DocumentType | null;
  document: string | null;
  stateRegistration: string | null;
  municipalRegistration: string | null;
  active: boolean;
  /** City and state of the primary address — what a list shows; `null` without one. */
  city: string | null;
  state: string | null;
  notes: string | null;
  /** Every address, primary first. Lists leave them out (`[]`). */
  addresses: AddressDto[];
  /** Every contact person, primary first. Lists leave them out (`[]`). */
  contacts: ContactDto[];
  createdAt: string;
  updatedAt: string;
}

/**
 * `GET /api/persons/summary`'s response — the four counters and "latest
 * entries" list `/home` needs. A dedicated aggregate endpoint so that page
 * asks Postgres for four `COUNT`s and a `LIMIT 5`, instead of fetching every
 * person over HTTP just to fold them client-side (what `get-registry-summary.ts`
 * used to do before server-side pagination made "just fetch everything"
 * stop being an option).
 */
export interface PersonSummaryDto {
  total: number;
  clients: number;
  suppliers: number;
  inactive: number;
  recent: Person[];
}
