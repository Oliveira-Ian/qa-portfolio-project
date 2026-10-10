import type { Metadata } from 'next';
import { CompanyAdminGate } from '@/components/platform/company-admin-gate';
import { getTranslator } from '@/lib/i18n/server';
import { MembersScreen } from '../_components/members-screen';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('company.members.title') };
}

/**
 * A member's drawer, deep-linked (handoff § 9a: `/company/members/:memberId`).
 * It is the members list with that member already open — see `MemberList`, which
 * keeps the drawer in sync with the address.
 */
export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <CompanyAdminGate>
      <MembersScreen selectedId={id} />
    </CompanyAdminGate>
  );
}
