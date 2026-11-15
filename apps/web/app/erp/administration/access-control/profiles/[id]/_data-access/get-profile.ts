import 'server-only';

import { cache } from 'react';
import type { ProfileDto } from '@oliveira/schemas';
import { unwrap } from '@/lib/api/client';
import { requestProfile } from '@/lib/api/profiles';
import { requireSession } from '@/lib/session';

export const getProfile = cache(async (id: number): Promise<ProfileDto> => {
  const { token } = await requireSession();
  return unwrap(await requestProfile(token, id));
});
