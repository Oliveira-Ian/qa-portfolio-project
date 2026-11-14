import 'server-only';

import { cache } from 'react';
import type { FsmDashboardDto } from '@oliveira/schemas';
import { unwrap } from '@/lib/api/client';
import { requestFsmDashboard } from '@/lib/api/fsm';
import { requireSession } from '@/lib/session';

/** The operation at a glance — every work order, or the technician's own (the API decides). */
export const getFsmDashboard = cache(async (): Promise<FsmDashboardDto> => {
  const { token } = await requireSession();

  return unwrap(await requestFsmDashboard(token));
});
