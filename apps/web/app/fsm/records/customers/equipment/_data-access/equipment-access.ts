import 'server-only';

import { equipmentWriteSchema } from '@oliveira/schemas';
import { equipmentApi } from '@/lib/api/fsm';
import { createRecordAccess } from '@/lib/fsm-records';
import { createGridPreferenceAccess } from '@/lib/grid-preferences';
import { ROUTES } from '@/lib/navigation/routes';

/** Reads and writes of the customers' equipment (`/api/fsm/equipment`). */
export const equipmentAccess = createRecordAccess({
  api: equipmentApi,
  listPath: ROUTES.fsm.equipment.list,
  schema: equipmentWriteSchema,
});

export const equipmentGrid = createGridPreferenceAccess('fsm-equipment-list');
