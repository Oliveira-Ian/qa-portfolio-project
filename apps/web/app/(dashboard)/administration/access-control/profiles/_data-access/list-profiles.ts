import 'server-only';

import { cache } from 'react';
import type { ProfileDto } from '@oliveira/schemas';
import { unwrap } from '@/lib/api/client';
import { requestProfileList } from '@/lib/api/profiles';
import { requireSession } from '@/lib/session';

export const listProfiles = cache(async (): Promise<ProfileDto[]> => {
  const { token } = await requireSession();
  return unwrap(await requestProfileList(token));
});
