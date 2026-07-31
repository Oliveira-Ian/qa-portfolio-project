/**
 * The single shape every Server Action in this app returns — mirrors the
 * API's own `{ success, ... }` envelope (`docs/api/http_responses.md`) so the
 * two layers read the same way, instead of each action inventing its own
 * `{ error? }` / `{ success, message }` / `{ success, message? }` variant.
 *
 * `message` covers both a failure's error text and, where the caller shows
 * one, a success confirmation (e.g. "3 people deleted"). An action that
 * redirects on success (every create/update form action) simply never
 * returns on that path at all — `redirect()` throws internally — so
 * `message` there is only ever read on failure.
 */
export interface ActionResult {
  success: boolean;
  message?: string;
}
