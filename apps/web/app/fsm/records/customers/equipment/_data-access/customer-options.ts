import 'server-only';

import type { CustomerOptionDto } from '@oliveira/schemas';
import { unwrap } from '@/lib/api/client';
import { requestCustomerOptions } from '@/lib/api/fsm';
import { requireSession } from '@/lib/session';

/** Active customers matching `search`, with their addresses — what the equipment form offers. */
export async function getCustomerOptions(search?: string): Promise<CustomerOptionDto[]> {
  const { token } = await requireSession();

  return unwrap(await requestCustomerOptions(token, search ? { search } : {}));
}

/** One customer as the picker shows it — the current choice of a record being edited. */
export async function getCustomerOption(id: string): Promise<CustomerOptionDto | null> {
  const { token } = await requireSession();

  return unwrap(await requestCustomerOptions(token, { id }))[0] ?? null;
}
