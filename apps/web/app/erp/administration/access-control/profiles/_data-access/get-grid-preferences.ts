import { createGridPreferenceAccess } from '@/lib/grid-preferences';

/** Identifies this grid to the shared preferences backend — see `docs/api/http_responses.md`. */
export const PROFILE_GRID_KEY = 'profile-list';

export const { getPreference: getProfileGridPreference } =
  createGridPreferenceAccess(PROFILE_GRID_KEY);
