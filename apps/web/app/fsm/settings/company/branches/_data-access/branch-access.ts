import 'server-only';

import { branchWriteSchema } from '@oliveira/schemas';
import type { FilterOption } from '@/components/data-table/types';
import { unwrap } from '@/lib/api/client';
import { branchesApi, requestBranchCities } from '@/lib/api/fsm';
import { createRecordAccess } from '@/lib/fsm-records';
import { createGridPreferenceAccess } from '@/lib/grid-preferences';
import { ROUTES } from '@/lib/navigation/routes';
import { requireSession } from '@/lib/session';

/**
 * Reads and writes of the company's branches through the FSM
 * (`/api/fsm/branches`, with the FSM's `branch:*` permissions).
 */
export const branchAccess = createRecordAccess({
  api: branchesApi,
  listPath: ROUTES.fsm.branches.list,
  schema: branchWriteSchema,
});

export const branchGrid = createGridPreferenceAccess('fsm-branch-list');

/** The cities the branches are in — the list's City filter. */
export async function getBranchCityOptions(): Promise<FilterOption[]> {
  const { token } = await requireSession();

  return unwrap(await requestBranchCities(token)).map((city) => ({ value: city, label: city }));
}
