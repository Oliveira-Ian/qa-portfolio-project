import type { Metadata } from 'next';
import { CompanyAdminGate } from '@/components/platform/company-admin-gate';
import { getTranslator } from '@/lib/i18n/server';
import { getCompanyMembers } from '../../_data-access/get-company-members';
import { NewMemberForm } from './_components/new-member-form';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('company.add.title') };
}

export default function NewMemberPage() {
  return (
    <CompanyAdminGate>
      <NewMemberScreen />
    </CompanyAdminGate>
  );
}

async function NewMemberScreen() {
  const company = await getCompanyMembers();

  return <NewMemberForm companyName={company.company.name} />;
}
