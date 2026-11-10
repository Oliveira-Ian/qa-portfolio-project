import type { Metadata } from 'next';
import { CompanyAdminGate } from '@/components/platform/company-admin-gate';
import { getTranslator } from '@/lib/i18n/server';
import { getMemberView } from '../../_data-access/get-member-view';
import { MemberEditForm } from './_components/member-edit-form';

interface EditMemberPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('company.member.editTitle') };
}

/** Role, product access, product profiles and — for a super admin — the Platform account. */
export default async function EditMemberPage({ params }: EditMemberPageProps) {
  const { id } = await params;

  return (
    <CompanyAdminGate>
      <EditMemberScreen id={id} />
    </CompanyAdminGate>
  );
}

async function EditMemberScreen({ id }: { id: string }) {
  return <MemberEditForm view={await getMemberView(id)} />;
}
