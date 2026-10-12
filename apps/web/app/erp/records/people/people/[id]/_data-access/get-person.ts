import 'server-only';

import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { Person } from '@oliveira/schemas';
import { requestPerson } from '@/lib/api/persons';
import { ApiError } from '@/lib/api/client';
import { requireSession } from '@/lib/session';

/**
 * `cache()` matters here: the view page and its edit child both ask for the
 * same record during one render, and this makes that a single request.
 *
 * A 404 from the API becomes Next's own not-found page rather than an error —
 * a missing record is a normal outcome, not a fault.
 */
export const getPerson = cache(async (id: string): Promise<Person> => {
  const { token } = await requireSession();
  const result = await requestPerson(token, id);

  if (!result.success) {
    if (result.status === 404) {
      notFound();
    }

    throw new ApiError(result.error, result.status);
  }

  return result.data;
});
