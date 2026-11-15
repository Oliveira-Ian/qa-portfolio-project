import 'server-only';

import { workOrderTypeWriteSchema } from '@oliveira/schemas';
import { workOrderTypesApi } from '@/lib/api/fsm';
import { createRecordAccess } from '@/lib/fsm-records';
import { createGridPreferenceAccess } from '@/lib/grid-preferences';
import { ROUTES } from '@/lib/navigation/routes';

/** Reads and writes of the FSM's work order types (`/api/fsm/work-order-types`). */
export const workOrderTypeAccess = createRecordAccess({
  api: workOrderTypesApi,
  listPath: ROUTES.fsm.workOrderTypes.list,
  schema: workOrderTypeWriteSchema,
});

export const workOrderTypeGrid = createGridPreferenceAccess('fsm-work-order-type-list');
