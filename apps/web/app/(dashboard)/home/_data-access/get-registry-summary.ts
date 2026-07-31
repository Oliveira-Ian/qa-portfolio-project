import 'server-only';

import { cache } from 'react';
import type { Person } from '@oliveira/schemas';
import { unwrap } from '@/lib/api/client';
import { requestPersonList } from '@/lib/api/persons';
import { requireSession } from '@/lib/session';

export interface RegistrySummary {
  total: number;
  clients: number;
  suppliers: number;
  inactive: number;
  recent: Person[];
}

const RECENT_LIMIT = 5;

/**
 * One request, counted in a single pass.
 *
 * The API has no aggregate endpoint, so asking it four times for four numbers
 * would mean four round trips to answer a question the list already contains.
 * `cache()` means the layout and the page share the same call.
 */
export const getRegistrySummary = cache(async (): Promise<RegistrySummary> => {
  const { token } = await requireSession();
  const people = unwrap(await requestPersonList(token));

  let clients = 0;
  let suppliers = 0;
  let inactive = 0;

  for (const person of people) {
    if (person.types.includes('CLIENT')) {
      clients += 1;
    }

    if (person.types.includes('SUPPLIER')) {
      suppliers += 1;
    }

    if (!person.active) {
      inactive += 1;
    }
  }

  return {
    total: people.length,
    clients,
    suppliers,
    inactive,
    // The API already sorts by createdAt desc.
    recent: people.slice(0, RECENT_LIMIT),
  };
});
