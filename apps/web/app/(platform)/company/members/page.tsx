import type { Metadata } from 'next';
import { CompanyAdminGate } from '@/components/platform/company-admin-gate';
import { getTranslator } from '@/lib/i18n/server';
import { MembersScreen } from './_components/members-screen';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('company.members.title') };
}

export default function MembersPage() {
  return (
    <CompanyAdminGate>
      <MembersScreen />
    </CompanyAdminGate>
  );
}
