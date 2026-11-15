import type { Metadata } from 'next';
import { CompanyAdminGate } from '@/components/platform/company-admin-gate';
import { getTranslator } from '@/lib/i18n/server';
import { getMemberView } from '../_data-access/get-member-view';
import { MemberRecord } from './_components/member-record';

interface MemberPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('company.members.title') };
}

/** One member, read-only — what a double click on the members list opens. */
export default async function MemberPage({ params }: MemberPageProps) {
  const { id } = await params;

  return (
    <CompanyAdminGate>
      <MemberScreen id={id} />
    </CompanyAdminGate>
  );
}

async function MemberScreen({ id }: { id: string }) {
  return <MemberRecord view={await getMemberView(id)} />;
}
