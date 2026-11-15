import 'server-only';

import { customerFormSchema, customerFormValuesToPayload } from '@oliveira/schemas';
import type { FilterOption } from '@/components/data-table/types';
import { unwrap } from '@/lib/api/client';
import { customersApi, requestCustomerCities, requestCustomerOptions } from '@/lib/api/fsm';
import { createRecordAccess } from '@/lib/fsm-records';
import { createGridPreferenceAccess } from '@/lib/grid-preferences';
import { ROUTES } from '@/lib/navigation/routes';
import { requireSession } from '@/lib/session';
import type { CustomerFilterChoices } from '../_components/customer-filters';

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

/** Customers to filter by, active or not, as the person types — or, with `ids`, those ones. */
export async function findCustomerFilterOptions(
  filter: { search?: string; ids?: string[] } = {},
): Promise<FilterOption[]> {
  const { token } = await requireSession();
  const rows = unwrap(await requestCustomerOptions(token, { ...filter, includeInactive: true }));

  return rows.map((row) => ({ value: row.id, label: row.name }));
}

/** The names of the customers the URL already filters by, and the cities to choose from. */
export async function getCustomerFilterChoices(
  chosenIds: string[],
): Promise<CustomerFilterChoices> {
  const { token } = await requireSession();
  const [chosen, cities] = await Promise.all([
    chosenIds.length > 0 ? findCustomerFilterOptions({ ids: chosenIds }) : [],
    requestCustomerCities(token),
  ]);

  return { chosen, cities: unwrap(cities).map((city) => ({ value: city, label: city })) };
}
