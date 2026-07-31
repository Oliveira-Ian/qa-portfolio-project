/**
 * Single source of truth for the e-mail format rule.
 *
 * The same pattern used to live copy-pasted in three places (the API's
 * `utils/email.ts` plus both auth forms in `apps/web`), which meant a fix in
 * one never reached the other two. `apps/api/src/utils/email.ts` now re-exports
 * this so the historical import path keeps working.
 *
 * Deliberately looser than a full RFC 5322 check: it matches what
 * `docs/product/auth_rules.md` promises ("email must have valid format") without
 * rejecting addresses a real user might own.
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email: string) => EMAIL_PATTERN.test(email);
