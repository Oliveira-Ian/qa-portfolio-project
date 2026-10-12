import { createGridPreferenceAccess } from '@/lib/grid-preferences';

/** Identifies this grid to the shared preferences backend — see `docs/api/http_responses.md`. */
export const ACCOUNT_GRID_KEY = 'account-list';

export const { getPreference: getAccountGridPreference } =
  createGridPreferenceAccess(ACCOUNT_GRID_KEY);
