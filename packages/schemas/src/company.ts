import { z } from 'zod';
import { isValidEmail } from './email.js';
import { maxLengthMessage } from './messages.js';

/**
 * The company's registration — central Platform data (docs/adr/0013, plan
 * § 2.9), shared by every product and edited only on the Platform, by the
 * company's account administrator. The legal name and the CNPJ identify the
 * company to Oliveira and are not part of this write: they are changed by
 * Oliveira, never from the company's own screens.
 */
const text = (max: number) => z.string().trim().max(max, maxLengthMessage(max));

export const companyProfileWriteSchema = z
  .object({
    tradeName: text(160),
    stateRegistration: text(20),
    municipalRegistration: text(20),
    email: text(160),
    phone: text(20),
    website: text(160),
    zipCode: text(9),
    street: text(160),
    number: text(20),
    complement: text(80),
    district: text(80),
    city: text(80),
    state: text(2),
  })
  .superRefine((data, ctx) => {
    if (data.email !== '' && !isValidEmail(data.email)) {
      ctx.addIssue({ code: 'custom', message: 'Invalid email', path: ['email'] });
    }
  });

/** Every field as text — `''` for empty. The API stores `''` as `null`. */
export type CompanyProfileFormValues = z.input<typeof companyProfileWriteSchema>;
export type CompanyProfileWriteInput = z.infer<typeof companyProfileWriteSchema>;

export interface CompanyProfileDto {
  id: string;
  legalName: string;
  /** CNPJ. */
  document: string | null;
  tradeName: string | null;
  stateRegistration: string | null;
  municipalRegistration: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  zipCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  updatedAt: string;
}

export function companyProfileToFormValues(company: CompanyProfileDto): CompanyProfileFormValues {
  return {
    tradeName: company.tradeName ?? '',
    stateRegistration: company.stateRegistration ?? '',
    municipalRegistration: company.municipalRegistration ?? '',
    email: company.email ?? '',
    phone: company.phone ?? '',
    website: company.website ?? '',
    zipCode: company.zipCode ?? '',
    street: company.street ?? '',
    number: company.number ?? '',
    complement: company.complement ?? '',
    district: company.district ?? '',
    city: company.city ?? '',
    state: company.state ?? '',
  };
}
