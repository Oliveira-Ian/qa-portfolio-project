import { NoProductAccess } from '@/components/platform/no-product-access';
import { ShellFor } from '@/components/shell/shell-for';
import { getMe } from '@/lib/permissions';

/**
 * The Oliveira ERP's area (docs/adr/0019) and its guard. `proxy.ts` turns
 * anonymous visitors away first, but `getMe()` (via `requireSession()`) is the
 * check that actually reads the session — the proxy only knows whether a cookie
 * exists.
 *
 * A signed-in user without a seat in the ERP gets the global bar and an
 * explanation instead of the page: `children` is never rendered for them, so a
 * URL typed straight in never shows the product. That is the courtesy; the
 * API's `requireProductAccess('ERP')` is the boundary.
 */
export default async function ErpLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();

  if (!me.products.includes('ERP')) {
    return (
      <ShellFor area="ERP" me={me} hideNavigation>
        <NoProductAccess product="ERP" membership={me.membership} />
      </ShellFor>
    );
  }

  return (
    <ShellFor area="ERP" me={me}>
      {children}
    </ShellFor>
  );
}
