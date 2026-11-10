import type { Metadata } from 'next';
import { CompanyAdminGate } from '@/components/platform/company-admin-gate';
import { getTranslator } from '@/lib/i18n/server';
import { getCompanyProfile } from '../_data-access/get-company-profile';
import { CompanyProfileForm } from './_components/company-profile-form';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('company.profile.editTitle') };
}

/** The company's registration — edited by its account administrator, on the Platform only. */
export default function EditCompanyPage() {
  return (
    <CompanyAdminGate>
      <EditCompanyScreen />
    </CompanyAdminGate>
  );
}

async function EditCompanyScreen() {
  const company = await getCompanyProfile();

  return <CompanyProfileForm company={company} />;
}
