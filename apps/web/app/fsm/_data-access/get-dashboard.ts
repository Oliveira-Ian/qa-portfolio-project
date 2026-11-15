import 'server-only';

import { cache } from 'react';
import type { FsmDashboardDto } from '@oliveira/schemas';
import { unwrap } from '@/lib/api/client';
import { requestFsmDashboard } from '@/lib/api/fsm';
import { can } from '@/lib/permissions';
import { requireSession } from '@/lib/session';

/** The operation at a glance — every work order, or the technician's own (the API decides). */
export const getFsmDashboard = cache(async (): Promise<FsmDashboardDto> => {
  const { token } = await requireSession();

  return unwrap(await requestFsmDashboard(token));
});

/**
 * The same summary for screens that only borrow its numbers (the work order
 * list's counts, the technicians' load): `null` without `dashboard:view`, and
 * those screens simply show no numbers.
 */
export async function getFsmDashboardIfAllowed(): Promise<FsmDashboardDto | null> {
  return (await can('FSM', 'dashboard:view')) ? getFsmDashboard() : null;
}
