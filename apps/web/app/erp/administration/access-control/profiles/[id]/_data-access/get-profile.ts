import 'server-only';

import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { ProfileDto } from '@oliveira/schemas';
import { ApiError } from '@/lib/api/client';
import { requestProfile } from '@/lib/api/profiles';
import { requireSession } from '@/lib/session';

/** One ERP profile. A 404 — unknown, another company's or another product's — is Next's not-found page. */
export const getProfile = cache(async (id: number): Promise<ProfileDto> => {
  const { token } = await requireSession();
  const result = await requestProfile(token, id);

  if (!result.success) {
    if (result.status === 404) {
      notFound();
    }

    throw new ApiError(result.error, result.status);
  }

  return result.data;
});
