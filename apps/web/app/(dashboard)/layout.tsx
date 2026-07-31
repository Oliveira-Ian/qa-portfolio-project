import { DashboardShell } from '@/components/layout/dashboard-shell';
import { getMe } from '@/lib/permissions';

/**
 * The guard for every dashboard route. `proxy.ts` turns anonymous visitors
 * away first, but `getMe()` (via `requireSession()`) is the check that
 * actually reads the session — the proxy only knows whether a cookie exists.
 *
 * Reading `/api/auth/me` here rather than trusting the session cookie means
 * the header and the sidebar's nav both reflect a role or profile change an
 * admin makes mid-session on the very next request, not just after the next
 * login.
 *
 * Only serializable data (name, e-mail, two plain booleans/arrays) crosses
 * into `DashboardShell` — the navigation catalog itself is filtered and
 * flattened *inside* the client tree, not here. `ModuleDefinition`'s `icon`
 * field is a component reference (a `LucideIcon` function), and functions
 * can't cross the Server→Client props boundary except as `'use server'`
 * actions; computing `filterCatalogForAccount()` server-side and handing the
 * result to a client component throws exactly on that.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();

  return (
    <DashboardShell
      userName={me.person.name}
      userEmail={me.account.email}
      isAdmin={me.account.role === 'ADMIN'}
      permissions={me.permissions}
    >
      {children}
    </DashboardShell>
  );
}
