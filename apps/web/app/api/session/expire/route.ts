import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/session';

/**
 * The only place in the app that clears the session cookie outside the sign-out
 * form action — reached when a page render (not a user click) discovers the
 * cookie is stale, most commonly the token outliving `JWT_EXPIRES_IN`. A Server
 * Component can `redirect()` here but cannot mutate cookies itself, so this
 * tiny Route Handler exists purely to do the one thing a component can't: clear
 * the cookie and redirect in the same response, breaking what would otherwise
 * be a loop between the dashboard (session looks present, so it tries to use
 * it) and `/login` (session is present, so `proxy.ts` bounces back to `/home`).
 */
export async function GET(request: Request) {
  await destroySession();
  return NextResponse.redirect(new URL('/login', request.url));
}
