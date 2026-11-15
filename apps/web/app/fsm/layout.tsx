import { NoProductAccess } from '@/components/platform/no-product-access';
import { ShellFor } from '@/components/shell/shell-for';
import { getMe } from '@/lib/permissions';

/**
 * The Oliveira FSM's area (docs/adr/0019), guarded like any product: no seat,
 * no page.
 */
export default async function FsmLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();

  if (!me.products.includes('FSM')) {
    return (
      <ShellFor area="FSM" me={me} hideNavigation>
        <NoProductAccess product="FSM" membership={me.membership} />
      </ShellFor>
    );
  }

  return (
    <ShellFor area="FSM" me={me}>
      {children}
    </ShellFor>
  );
}
