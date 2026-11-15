import 'server-only';

import type { Product } from '@oliveira/schemas';
import type { FilterOption } from '@/components/data-table/types';
import { unwrap } from '@/lib/api/client';
import { requestProfileList } from '@/lib/api/profiles';
import { EMPTY_LIST_QUERY } from '@/lib/list-query';
import { requireSession } from '@/lib/session';

/** The product's profiles, as the options of a users list's Profile filter (by id). */
export async function getProfileFilterOptions(product: Product): Promise<FilterOption[]> {
  const { token } = await requireSession();
  const profiles = unwrap(
    await requestProfileList(token, { ...EMPTY_LIST_QUERY, pageSize: 100 }, product),
  );

  return profiles.items.map((profile) => ({ value: String(profile.id), label: profile.name }));
}
