import 'server-only';

import { createGridPreferenceAccess } from '@/lib/grid-preferences';
import { ROUTES } from '@/lib/navigation/routes';
import { createProfileAccess } from '@/lib/profile-access';

/** The ERP's access profiles, through the ERP's own profile API. */
export const profileAccess = createProfileAccess('ERP', ROUTES.profiles.list);

export const profileGrid = createGridPreferenceAccess('profile-list');
