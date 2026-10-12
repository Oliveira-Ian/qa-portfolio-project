import 'server-only';

import { revalidatePath } from 'next/cache';
import { ROUTES } from '@/lib/navigation/routes';

/**
 * A member's role, status or seat shows up in the members list, the product
 * access screen, the company overview and the Home strip (seats in use) — so a
 * change to any of them refreshes all four. `'layout'` covers every page under
 * `/company` at once.
 */
export function revalidateCompany(): void {
  revalidatePath(ROUTES.company.overview, 'layout');
  revalidatePath(ROUTES.home);
}
