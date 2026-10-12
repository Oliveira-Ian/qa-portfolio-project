import { getTranslator } from '@/lib/i18n/server';
import { ROUTES } from '@/lib/navigation/routes';
import { getMe } from '@/lib/permissions';
import { GuardPanel } from './guard-panel';

/**
 * Wraps a company-administration page: a company admin sees it; anyone else sees
 * why they can't, inside the Platform shell, rather than being bounced to Home or
 * hitting the API's 403 as an error page. `children` is only rendered — so only
 * fetches its data — for an admin. The API enforces the same rule either way;
 * this is the explanation, not the lock.
 */
export async function CompanyAdminGate({ children }: { children: React.ReactNode }) {
  const [t, me] = await Promise.all([getTranslator(), getMe()]);

  if (me.membership?.role === 'ADMIN') {
    return children;
  }

  return (
    <GuardPanel
      testId="no-company-admin"
      overline={t('guard.companyAdmin.overline')}
      title={t('guard.companyAdmin.title')}
      body={
        me.membership
          ? t('guard.companyAdmin.body', { company: me.membership.companyName })
          : t('guard.companyAdmin.bodyNoCompany')
      }
      backHref={ROUTES.home}
      backLabel={t('guard.backToHome')}
    />
  );
}
