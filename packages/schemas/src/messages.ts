/**
 * Validation wordings shared by several schemas. They are the API's contract
 * strings (docs/api/http_responses.md) and the web app translates them by
 * pattern (`apps/web/lib/i18n/api-messages.ts`), so each is phrased once.
 */

/** Every length limit says the same thing, with only the number changing. */
export const maxLengthMessage = (max: number) => `Use at most ${max} characters`;
