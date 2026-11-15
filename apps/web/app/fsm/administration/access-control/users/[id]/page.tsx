import type { Metadata } from 'next';
import { UserRecord } from '@/components/access-control/user-record';
import { NoPermission } from '@/components/platform/no-permission';
import { ROUTES } from '@/lib/navigation/routes';
import { can } from '@/lib/permissions';
import { getFsmAccount } from '../_data-access/user-access';

interface UserPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: UserPageProps): Promise<Metadata> {
  if (!(await can('FSM', 'profile:manage'))) {
    return {};
  }

  return { title: (await getFsmAccount(Number.parseInt((await params).id, 10))).personName };
}

/** One member as the FSM sees them — what a double click on the Users list opens. */
export default async function FsmUserPage({ params }: UserPageProps) {
  if (!(await can('FSM', 'profile:manage'))) {
    return <NoPermission product="FSM" screen="nav.fsm.users" />;
  }

  const account = await getFsmAccount(Number.parseInt((await params).id, 10));

  return <UserRecord product="FSM" account={account} basePath={ROUTES.fsm.users.list} />;
}
