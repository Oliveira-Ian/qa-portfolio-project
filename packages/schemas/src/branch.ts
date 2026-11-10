import { z } from 'zod';
import { maxLengthMessage } from './messages.js';

/**
 * A company's branch (docs/adr/0013, addendum of 2026-11-10): a place the
 * company operates from, kept minimal on purpose. Work orders may name one; no
 * access is restricted by branch yet, and nothing is "the active branch" of a
 * session.
 *
 * One schema serves the API and the form: optional text arrives as `''` from
 * the form and is stored as `null` by the API.
 */
const optionalText = (max: number) =>
  z.string().trim().max(max, maxLengthMessage(max)).optional().default('');

export const branchWriteSchema = z.object({
  code: z.string().trim().min(1, 'Code is required').max(20, maxLengthMessage(20)),
  name: z.string().trim().min(1, 'Name is required').max(120, maxLengthMessage(120)),
  street: optionalText(160),
  city: optionalText(80),
  state: optionalText(2),
  zipCode: optionalText(9),
  active: z.boolean().default(true),
});

export type BranchWriteInput = z.infer<typeof branchWriteSchema>;
/** What the branch form holds — every field present, text as typed. */
export interface BranchFormValues {
  code: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  active: boolean;
}

export const emptyBranchFormValues: BranchFormValues = {
  code: '',
  name: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  active: true,
};

export interface BranchDto {
  id: string;
  code: string;
  name: string;
  street: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export function branchToFormValues(branch: BranchDto): BranchFormValues {
  return {
    code: branch.code,
    name: branch.name,
    street: branch.street ?? '',
    city: branch.city ?? '',
    state: branch.state ?? '',
    zipCode: branch.zipCode ?? '',
    active: branch.active,
  };
}
