import 'server-only';

import { createGridPreferenceAccess } from '@/lib/grid-preferences';
import { ROUTES } from '@/lib/navigation/routes';
import { createProfileAccess } from '@/lib/profile-access';

/** The FSM's access profiles, through the FSM's own profile API. */
export const profileAccess = createProfileAccess('FSM', ROUTES.fsm.profiles.list);

export const profileGrid = createGridPreferenceAccess('fsm-profile-list');
