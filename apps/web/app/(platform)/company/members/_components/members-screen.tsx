import { notFound } from 'next/navigation';
import { getMe } from '@/lib/permissions';
import { getCompanyMembers } from '../../_data-access/get-company-members';
import { MemberList } from './member-list';

/**
 * The members list, loaded. Without a company there is nothing to list —
 * `getMe()` says so before the API is asked for members it would refuse.
 */
export async function MembersScreen() {
  const me = await getMe();

  if (!me.membership) {
    notFound();
  }

  return <MemberList company={await getCompanyMembers()} />;
}
