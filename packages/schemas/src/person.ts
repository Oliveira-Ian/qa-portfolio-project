import { z } from 'zod';
import { isValidEmail } from './email.js';

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
export const personCreateSchema = z
  .object({
    name: requiredText('Name is required'),
    types: z.array(personTypeValueSchema).min(1, 'At least one type is required'),
    documentType: documentTypeSchema.nullable().optional(),
    document: z.string().trim().nullable().optional(),
    email: z.string().trim().email('Invalid email').nullable().optional(),
    phone: z.string().trim().nullable().optional(),
    birthdate: z.coerce.date().nullable().optional(),
    active: z.boolean().optional(),
    street: z.string().trim().nullable().optional(),
    city: z.string().trim().nullable().optional(),
    state: z.string().trim().nullable().optional(),
    zipCode: z.string().trim().nullable().optional(),
    notes: z.string().trim().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (!requiresDocument(data.types)) {
      return;
    }

    if (!data.document || data.document.trim().length === 0) {
      ctx.addIssue({ code: 'custom', message: 'Document is required', path: ['document'] });
      return;
    }

    if (!data.documentType) {
      ctx.addIssue({
        code: 'custom',
        message: 'Document type is required',
        path: ['documentType'],
      });
      return;
    }

    if (data.document.replace(/\D/g, '').length !== documentLengthByType[data.documentType]) {
      ctx.addIssue({ code: 'custom', message: 'Invalid document format', path: ['document'] });
    }
  });

// PUT is a full replace, not a patch (docs/api/http_responses.md documents the
// same body for POST and PUT). It also cannot be `.partial()`: the
// `.superRefine()` above turns the object into a ZodEffects, which has no
// `.partial()`.
export const personUpdateSchema = personCreateSchema;

export type PersonCreateInput = z.infer<typeof personCreateSchema>;
export type PersonUpdateInput = z.infer<typeof personUpdateSchema>;
export type PersonTypeValue = z.infer<typeof personTypeValueSchema>;
export type DocumentType = z.infer<typeof documentTypeSchema>;

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
export const personFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    types: z.array(personTypeValueSchema).min(1, 'At least one type is required'),
    documentType: documentTypeSchema.nullable(),
    document: z.string().trim(),
    email: z.string().trim(),
    phone: z.string().trim(),
    birthdate: z.string(),
    active: z.boolean(),
    street: z.string().trim(),
    city: z.string().trim(),
    state: z.string().trim(),
    zipCode: z.string().trim(),
    notes: z.string().trim(),
  })
  .superRefine((data, ctx) => {
    if (data.email !== '' && !isValidEmail(data.email)) {
      ctx.addIssue({ code: 'custom', message: 'Invalid email', path: ['email'] });
    }

    if (!requiresDocument(data.types)) {
      return;
    }

    if (data.document === '') {
      ctx.addIssue({ code: 'custom', message: 'Document is required', path: ['document'] });
      return;
    }

    if (!data.documentType) {
      ctx.addIssue({
        code: 'custom',
        message: 'Document type is required',
        path: ['documentType'],
      });
      return;
    }

    if (data.document.replace(/\D/g, '').length !== documentLengthByType[data.documentType]) {
      ctx.addIssue({ code: 'custom', message: 'Invalid document format', path: ['document'] });
    }
  });

export type PersonFormValues = z.infer<typeof personFormSchema>;

export const emptyPersonFormValues: PersonFormValues = {
  name: '',
  types: [],
  documentType: null,
  document: '',
  email: '',
  phone: '',
  birthdate: '',
  active: true,
  street: '',
  city: '',
  state: '',
  zipCode: '',
  notes: '',
};

/** Wire record → form values. An absent field is an empty string, never null. */
export function personToFormValues(person: Person): PersonFormValues {
  return {
    name: person.name,
    types: person.types,
    documentType: person.documentType,
    document: person.document ?? '',
    email: person.email ?? '',
    phone: person.phone ?? '',
    // `<input type="date">` wants the calendar day, not the instant.
    birthdate: person.birthdate ? person.birthdate.slice(0, 10) : '',
    active: person.active,
    street: person.street ?? '',
    city: person.city ?? '',
    state: person.state ?? '',
    zipCode: person.zipCode ?? '',
    notes: person.notes ?? '',
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
    email: orNull(values.email),
    phone: orNull(values.phone),
    birthdate: values.birthdate ? new Date(values.birthdate) : null,
    active: values.active,
    street: orNull(values.street),
    city: orNull(values.city),
    state: orNull(values.state),
    zipCode: orNull(values.zipCode),
    notes: orNull(values.notes),
  };
}

/**
 * A Person as it crosses the wire: dates already serialized to ISO strings.
 * Derived from the create schema so a new field can't be added to one without
 * the other, and shared by `apps/api` and `apps/web`.
 */
export interface Person {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  birthdate: string | null;
  types: PersonTypeValue[];
  documentType: DocumentType | null;
  document: string | null;
  active: boolean;
  street: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
