import { ShellFor } from '@/components/shell/shell-for';
import { getMe } from '@/lib/permissions';

/**
 * The Platform's own area: the home, and the company's administration. It is
 * where every signed-in user lands, whether or not they can open any product —
 * an account with no company is a normal state here, not an error (docs/adr/0018).
 *
 * `proxy.ts` turns anonymous visitors away first; `getMe()` (via
 * `requireSession()`) is the check that actually reads the session.
 */
export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();

  return (
    <ShellFor area="platform" me={me}>
      {children}
    </ShellFor>
  );
}
