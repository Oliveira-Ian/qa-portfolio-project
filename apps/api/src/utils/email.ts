/**
 * Kept as a re-export so the historical import path stays valid; the rule
 * itself now lives in `packages/schemas` so `apps/web` shares it instead of
 * carrying its own copy of the pattern.
 */
export { EMAIL_PATTERN, isValidEmail } from '@oliveira/schemas';
