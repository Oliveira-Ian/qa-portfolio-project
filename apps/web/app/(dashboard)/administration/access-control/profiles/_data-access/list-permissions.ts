import 'server-only';

import { cache } from 'react';
import type { PermissionDto } from '@oliveira/schemas';
import { unwrap } from '@/lib/api/client';
import { requestPermissionList } from '@/lib/api/permissions';
import { requireSession } from '@/lib/session';

export const listPermissions = cache(async (): Promise<PermissionDto[]> => {
  const { token } = await requireSession();
  return unwrap(await requestPermissionList(token));
});
