import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';

/**
 * A cheap gate, not the security boundary.
 *
 * It only checks that a session cookie is *shaped* like a session — verifying
 * the signature would mean shipping a JWT library to the edge runtime for no
 * real gain, because the API validates the token on every request anyway.
 * What this buys is the user experience: an expired session lands on `/login`
 * instead of flashing an empty dashboard that then errors.
 *
 * The shape check (not just presence) matters: a cookie left over from a
 * previous session-shape (e.g. set before a schema change) must NOT count as
 * a session here, or `/login` bounces it to `/home`, whose layout fails to
 * parse the same cookie and bounces back to `/login` — an infinite loop that
 * never gives the user a chance to sign in and overwrite the stale cookie.
 *
 * `proxy.ts` is Next 16's name for what used to be `middleware.ts`.
 */
const PROTECTED_PREFIXES = ['/home', '/records', '/administration'];
const AUTH_ROUTES = ['/login', '/register'];

function looksLikeSession(raw: string | undefined): boolean {
  if (!raw) {
    return false;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as { token?: unknown }).token === 'string' &&
      typeof (parsed as { account?: { role?: unknown } }).account?.role === 'string'
    );
  } catch {
    return false;
  }
}

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = looksLikeSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (!hasSession && PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    const loginUrl = new URL('/login', request.url);
    // Remember where they were headed so signing in resumes the journey.
    loginUrl.searchParams.set('next', `${pathname}${search}`);

    return NextResponse.redirect(loginUrl);
  }

  // Signing in again when you already have a session just puts you back home.
  if (hasSession && AUTH_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/home/:path*', '/records/:path*', '/administration/:path*', '/login', '/register'],
};
