import 'server-only';

import { catalogItemWriteSchema } from '@oliveira/schemas';
import { catalogItemsApi } from '@/lib/api/fsm';
import { createRecordAccess } from '@/lib/fsm-records';
import { createGridPreferenceAccess } from '@/lib/grid-preferences';
import { ROUTES } from '@/lib/navigation/routes';

/** Reads and writes of the FSM's products and services (`/api/fsm/catalog-items`). */
export const catalogItemAccess = createRecordAccess({
  api: catalogItemsApi,
  listPath: ROUTES.fsm.catalogItems.list,
  schema: catalogItemWriteSchema,
});

export const catalogItemGrid = createGridPreferenceAccess('fsm-catalog-item-list');
