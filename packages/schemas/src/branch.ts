import { z } from 'zod';
import {
  addressToFormValues,
  addressWriteSchema,
  emptyAddressFormValues,
  type AddressDto,
  type AddressFormValues,
} from './address.js';
import { isValidEmail } from './email.js';
import { maxLengthMessage } from './messages.js';

/**
 * A company's branch (docs/adr/0013, addendum of 2026-11-10): a place the
 * company operates from, with its own tax registration when it has one. One
 * table for every product; each product manages branches with its own
 * permissions. No access is restricted by branch yet.
 *
 * One schema serves the API and the form: optional text is `''` and the API
 * stores it as `null`.
 */
const text = (max: number) => z.string().trim().max(max, maxLengthMessage(max));

export const branchWriteSchema = z
  .object({
    code: z.string().trim().min(1, 'Code is required').max(20, maxLengthMessage(20)),
    name: z.string().trim().min(1, 'Name is required').max(120, maxLengthMessage(120)),
    /** CNPJ of the branch, when it has its own. */
    document: text(18),
    stateRegistration: text(20),
    email: text(160),
    phone: text(20),
    active: z.boolean(),
    address: addressWriteSchema,
  })
  .superRefine((data, ctx) => {
    if (data.email !== '' && !isValidEmail(data.email)) {
      ctx.addIssue({ code: 'custom', message: 'Invalid email', path: ['email'] });
    }

    const digits = data.document.replace(/\D/g, '');

    if (digits !== '' && digits.length !== 14) {
      ctx.addIssue({ code: 'custom', message: 'Invalid document format', path: ['document'] });
    }
  });

export type BranchWriteInput = z.infer<typeof branchWriteSchema>;

export interface BranchFormValues {
  code: string;
  name: string;
  document: string;
  stateRegistration: string;
  email: string;
  phone: string;
  active: boolean;
  address: AddressFormValues;
}

export const emptyBranchFormValues: BranchFormValues = {
  code: '',
  name: '',
  document: '',
  stateRegistration: '',
  email: '',
  phone: '',
  active: true,
  address: emptyAddressFormValues(true),
};

export interface BranchDto {
  id: string;
  code: string;
  name: string;
  document: string | null;
  stateRegistration: string | null;
  email: string | null;
  phone: string | null;
  active: boolean;
  /** The branch's address, when one was given. */
  address: AddressDto | null;
  createdAt: string;
  updatedAt: string;
}

export function branchToFormValues(branch: BranchDto): BranchFormValues {
  return {
    code: branch.code,
    name: branch.name,
    document: branch.document ?? '',
    stateRegistration: branch.stateRegistration ?? '',
    email: branch.email ?? '',
    phone: branch.phone ?? '',
    active: branch.active,
    address: branch.address ? addressToFormValues(branch.address) : emptyAddressFormValues(true),
  };
}
