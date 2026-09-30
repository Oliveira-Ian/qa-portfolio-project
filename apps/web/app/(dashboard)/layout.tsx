import { DashboardShell } from '@/components/layout/dashboard-shell';
import { NoProductAccess } from '@/components/platform/no-product-access';
import { getMe } from '@/lib/permissions';

/**
 * The guard for every dashboard route — which today are the ERP's. `proxy.ts`
 * turns anonymous visitors away first, but `getMe()` (via `requireSession()`) is
 * the check that actually reads the session — the proxy only knows whether a
 * cookie exists.
 *
 * Reading `/api/auth/me` here rather than trusting the session cookie means
 * the header and the sidebar's nav both reflect a seat or profile change an
 * administrator makes mid-session on the very next request, not just after the
 * next login.
 *
 * A signed-in user without a seat in the ERP gets the shell and a notice
 * instead of the page: `children` is never rendered for them. That is the
 * courtesy; the API's `requireProductAccess('ERP')` is the boundary.
 *
 * Only serializable data (name, e-mail, an array) crosses into
 * `DashboardShell` — the navigation catalog itself is filtered and flattened
 * *inside* the client tree, not here. `ModuleDefinition`'s `icon` field is a
 * component reference (a `LucideIcon` function), and functions can't cross the
 * Server→Client props boundary except as `'use server'` actions; computing
 * `filterCatalogForAccount()` server-side and handing the result to a client
 * component throws exactly on that.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  const hasErpAccess = me.products.includes('ERP');

  return (
    <DashboardShell
      userName={me.person.name}
      userEmail={me.account.email}
      permissions={me.permissions}
    >
      {hasErpAccess ? children : <NoProductAccess product="ERP" membership={me.membership} />}
    </DashboardShell>
  );
}
