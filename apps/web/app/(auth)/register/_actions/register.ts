'use server';

import { authMessages, registerFormSchema, type RegisterFormValues } from '@oliveira/schemas';
import { requestRegister } from '@/lib/api/auth';
import type { ActionResult } from '@/lib/actions';
import { isPublicRegistrationEnabled } from '@/lib/deployment';

export async function registerAction(values: RegisterFormValues): Promise<ActionResult> {
  // The page is not found when sign-up is off; the action refuses too.
  if (!isPublicRegistrationEnabled()) {
    return { success: false, message: 'Route not found' };
  }

  const parsed = registerFormSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, message: authMessages.register.missingFields };
  }

  const result = await requestRegister(parsed.data);

  if (!result.success) {
    return { success: false, message: result.error };
  }

  // The redirect happens on the client after the confirmation toast has been
  // seen — see `_components/register-form.tsx`.
  return { success: true, message: 'Registration successful' };
}
