import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { ROUTES } from '@/lib/navigation/routes';

/**
 * `/` has no page of its own: the Platform's front door is the sign-in, and a
 * signed-in user's is the home. The old marketing landing page (a construction
 * site photograph and "the register every site runs on") described a product
 * this is not any more, and is gone with the rest of the pre-Platform identity.
 */
export default async function RootPage() {
  redirect((await getSession()) ? ROUTES.home : ROUTES.login);
}
