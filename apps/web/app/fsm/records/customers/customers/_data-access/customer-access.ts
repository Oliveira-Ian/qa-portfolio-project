import 'server-only';

import { customerFormSchema, customerFormValuesToPayload } from '@oliveira/schemas';
import { customersApi } from '@/lib/api/fsm';
import { createRecordAccess } from '@/lib/fsm-records';
import { createGridPreferenceAccess } from '@/lib/grid-preferences';
import { ROUTES } from '@/lib/navigation/routes';

/**
 * Reads and writes of the FSM's customers (`/api/fsm/customers`). The form
 * holds a person's values; the request carries them without the ERP's types.
 */
export const customerAccess = createRecordAccess({
  api: customersApi,
  listPath: ROUTES.fsm.customers.list,
  schema: customerFormSchema,
  toPayload: customerFormValuesToPayload,
});

export const customerGrid = createGridPreferenceAccess('fsm-customer-list');
