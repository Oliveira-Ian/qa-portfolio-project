import { createGridPreferenceAccess } from '@/lib/grid-preferences';

/** Identifies this grid to the shared preferences backend — see `docs/api/http_responses.md`. */
export const PERSON_GRID_KEY = 'person-list';

export const { getPreference: getPersonGridPreference } = createGridPreferenceAccess(PERSON_GRID_KEY);
