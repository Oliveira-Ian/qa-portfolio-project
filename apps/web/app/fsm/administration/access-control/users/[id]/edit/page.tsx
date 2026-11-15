import type { Metadata } from 'next';
import { UserProfileForm } from '@/components/access-control/user-profile-form';
import { NoPermission } from '@/components/platform/no-permission';
import { EMPTY_LIST_QUERY } from '@/lib/list-query';
import { ROUTES } from '@/lib/navigation/routes';
import { can } from '@/lib/permissions';
import { profileAccess } from '../../../profiles/_data-access/profile-access';
import { setFsmProfileAction } from '../../_actions/user-actions';
import { getFsmAccount } from '../../_data-access/user-access';

interface EditUserPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditUserPageProps): Promise<Metadata> {
  if (!(await can('FSM', 'profile:manage'))) {
    return {};
  }

  return { title: (await getFsmAccount(Number.parseInt((await params).id, 10))).personName };
}

/** Picks the member's FSM profile. */
export default async function EditFsmUserPage({ params }: EditUserPageProps) {
  if (!(await can('FSM', 'profile:manage'))) {
    return <NoPermission product="FSM" screen="nav.fsm.users" />;
  }

  const id = Number.parseInt((await params).id, 10);
  // The picker needs every profile; a company has a handful.
  const [account, profiles] = await Promise.all([
    getFsmAccount(id),
    profileAccess.list({ ...EMPTY_LIST_QUERY, pageSize: 100 }),
  ]);

  return (
    <UserProfileForm
      product="FSM"
      account={account}
      profiles={profiles.items}
      setProfileAction={setFsmProfileAction}
      basePath={ROUTES.fsm.users.list}
    />
  );
}
