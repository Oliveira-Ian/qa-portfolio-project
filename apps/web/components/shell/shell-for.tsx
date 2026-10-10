import type { MeResponse } from '@oliveira/schemas';
import type { AreaKey } from '@/lib/navigation/nav';
import { AppShell } from './app-shell';

interface ShellForProps {
  area: AreaKey;
  /** `GET /api/auth/me`, from `getMe()` — never the session cookie's copy. */
  me: MeResponse;
  hideNavigation?: boolean;
  children: React.ReactNode;
}

/**
 * The bridge between a layout's Server Component and the client shell: it
 * hands over only plain, serializable data. Reading `/api/auth/me` in the layout
 * (rather than trusting the cookie) means the bar and the sidebar reflect a seat
 * or profile change an administrator makes mid-session on the very next render.
 */
export function ShellFor({ area, me, hideNavigation = false, children }: ShellForProps) {
  return (
    <AppShell
      area={area}
      userName={me.person.name}
      userEmail={me.account.email}
      companyName={me.membership?.companyName ?? null}
      isCompanyAdmin={me.membership?.role === 'ADMIN'}
      products={me.products}
      permissions={me.permissions}
      hideNavigation={hideNavigation}
    >
      {children}
    </AppShell>
  );
}
