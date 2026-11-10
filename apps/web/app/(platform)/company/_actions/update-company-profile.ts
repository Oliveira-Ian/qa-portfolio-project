'use server';

import { companyProfileWriteSchema, type CompanyProfileFormValues } from '@oliveira/schemas';
import type { ActionResult } from '@/lib/actions';
import { requestCompanyProfileUpdate } from '@/lib/api/company';
import { requireSession } from '@/lib/session';
import { revalidateCompany } from './revalidate-company';

/** Saves the company's registration — the API refuses anyone but the company's account administrator. */
export async function updateCompanyProfileAction(
  values: CompanyProfileFormValues,
): Promise<ActionResult> {
  const parsed = companyProfileWriteSchema.safeParse(values);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];

    return {
      success: false,
      message: issue?.message ?? 'Invalid data',
      ...(issue?.path[0] ? { field: String(issue.path[0]) } : {}),
    };
  }

  const { token } = await requireSession();
  const result = await requestCompanyProfileUpdate(token, parsed.data);

  if (!result.success) {
    return { success: false, message: result.error };
  }

  revalidateCompany();

  return { success: true };
}
