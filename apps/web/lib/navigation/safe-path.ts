/**
 * An absolute path on this site: `/`, then nothing a browser could read as
 * *another origin*. `//host` and `/\host` are protocol-relative, and a tab or
 * newline anywhere is stripped by the URL parser — `/<tab>/host` becomes
 * `//host` — so every backslash and control character is refused too. A bare
 * `startsWith('/')` let all of those through, so `/login?next=//host` signed the
 * user in and then sent them off the site.
 */
function isInternalPath(value: string): boolean {
  if (!value.startsWith('/') || value.startsWith('//')) {
    return false;
  }

  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;

    if (character === '\\' || code <= 0x1f || code === 0x7f) {
      return false;
    }
  }

  return true;
}

/**
 * Where to send the user after an action that took a `next` from the address
 * bar. Anything that is not a path on this site falls back — never trust a
 * query parameter to name a destination.
 */
export function getSafeRedirectPath(candidate: string | undefined, fallback: string): string {
  return candidate !== undefined && isInternalPath(candidate) ? candidate : fallback;
}
