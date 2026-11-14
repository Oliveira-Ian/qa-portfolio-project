import 'server-only';

import { branchWriteSchema } from '@oliveira/schemas';
import { branchesApi } from '@/lib/api/fsm';
import { createRecordAccess } from '@/lib/fsm-records';
import { createGridPreferenceAccess } from '@/lib/grid-preferences';
import { ROUTES } from '@/lib/navigation/routes';

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
