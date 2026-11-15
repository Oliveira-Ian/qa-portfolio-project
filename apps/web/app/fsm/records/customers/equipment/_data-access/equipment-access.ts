import 'server-only';

import { equipmentWriteSchema } from '@oliveira/schemas';
import { unwrap } from '@/lib/api/client';
import { equipmentApi, requestEquipmentCategories } from '@/lib/api/fsm';
import { createRecordAccess } from '@/lib/fsm-records';
import { createGridPreferenceAccess } from '@/lib/grid-preferences';
import { ROUTES } from '@/lib/navigation/routes';
import { requireSession } from '@/lib/session';
import { findCustomerFilterOptions } from '../../customers/_data-access/customer-access';
import type { EquipmentFilterChoices } from '../_components/equipment-filters';

/** Reads and writes of the customers' equipment (`/api/fsm/equipment`). */
export const equipmentAccess = createRecordAccess({
  api: equipmentApi,
  listPath: ROUTES.fsm.equipment.list,
  schema: equipmentWriteSchema,
});

export const equipmentGrid = createGridPreferenceAccess('fsm-equipment-list');

/** The names of the customers the URL already filters by, and the categories to choose from. */
export async function getEquipmentFilterChoices(
  chosenCustomerIds: string[],
): Promise<EquipmentFilterChoices> {
  const { token } = await requireSession();
  const [customers, categories] = await Promise.all([
    chosenCustomerIds.length > 0 ? findCustomerFilterOptions({ ids: chosenCustomerIds }) : [],
    requestEquipmentCategories(token),
  ]);

  return {
    customers,
    categories: unwrap(categories).map((category) => ({ value: category, label: category })),
  };
}
