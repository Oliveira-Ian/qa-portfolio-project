import { notFound } from 'next/navigation';
import { getMe } from '@/lib/permissions';
import { getCompanyMembers } from '../../_data-access/get-company-members';
import { MemberList } from './member-list';

/**
 * The members list, loaded. `selectedId` is only the deep link
 * (`/company/members/:id`): an id that isn't one of this company's members is a
 * 404 instead of a list with nothing open. Without a company there is nothing to
 * list — `getMe()` says so before the API is asked for members it would refuse.
 */
export async function MembersScreen({ selectedId }: { selectedId?: string }) {
  const me = await getMe();

  if (!me.membership) {
    notFound();
  }

  const company = await getCompanyMembers();

  if (selectedId !== undefined && !company.members.some((member) => member.id === selectedId)) {
    notFound();
  }

  return <MemberList company={company} />;
}
