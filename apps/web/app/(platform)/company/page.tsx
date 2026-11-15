import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CompanyAdminGate } from '@/components/platform/company-admin-gate';
import { getTranslator } from '@/lib/i18n/server';
import { getMe } from '@/lib/permissions';
import { CompanyOverview } from './_components/company-overview';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('company.overview.title') };
}

async function CompanyOverviewScreen() {
  const me = await getMe();

  // Only reached by a company admin, who by definition has a company.
  if (!me.membership) {
    notFound();
  }

  return <CompanyOverview />;
}

export default function CompanyPage() {
  return (
    <CompanyAdminGate>
      <CompanyOverviewScreen />
    </CompanyAdminGate>
  );
}
