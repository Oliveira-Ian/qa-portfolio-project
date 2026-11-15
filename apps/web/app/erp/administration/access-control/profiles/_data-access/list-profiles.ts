import 'server-only';

import { cache } from 'react';
import type { PaginatedResult, ProfileDto } from '@oliveira/schemas';
import { unwrap } from '@/lib/api/client';
import { requestProfileList } from '@/lib/api/profiles';
import type { ListQueryState } from '@/lib/list-query';
import { requireSession } from '@/lib/session';

export const listProfiles = cache(
  async (query: ListQueryState): Promise<PaginatedResult<ProfileDto>> => {
    const { token } = await requireSession();

    return unwrap(await requestProfileList(token, query));
  },
);
