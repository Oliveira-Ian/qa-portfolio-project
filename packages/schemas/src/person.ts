import { z } from 'zod';

export const personTypeSchema = z.enum(['CLIENT', 'SUPPLIER']);
export const documentTypeSchema = z.enum(['CPF', 'CNPJ']);

const documentLengthByType: Record<z.infer<typeof documentTypeSchema>, number> = {
  CPF: 11,
  CNPJ: 14,
};

// Missing (undefined/null) required text fields must fail with the same
// friendly message as an empty string — plain .min(1) alone only catches
// the empty-string case and falls back to a generic type error otherwise.
const requiredText = (message: string) =>
  z.preprocess(
    (value) => (value === undefined || value === null ? '' : value),
    z.string().trim().min(1, message),
  );

export const personCreateSchema = z
  .object({
    name: requiredText('Name is required'),
    type: personTypeSchema,
    documentType: documentTypeSchema,
    document: requiredText('Document is required'),
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
  .refine(
    (data) => data.document.replace(/\D/g, '').length === documentLengthByType[data.documentType],
    { message: 'Invalid document format', path: ['document'] },
  );

export const personUpdateSchema = personCreateSchema;

export type PersonCreateInput = z.infer<typeof personCreateSchema>;
export type PersonUpdateInput = z.infer<typeof personUpdateSchema>;
