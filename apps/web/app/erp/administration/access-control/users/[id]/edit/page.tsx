import type { Metadata } from 'next';
import { UserProfileForm } from '@/components/access-control/user-profile-form';
import { NoPermission } from '@/components/platform/no-permission';
import { EMPTY_LIST_QUERY } from '@/lib/list-query';
import { ROUTES } from '@/lib/navigation/routes';
import { can } from '@/lib/permissions';
import { listProfiles } from '../../../profiles/_data-access/list-profiles';
import { setErpProfileAction } from '../../_actions/set-profile';
import { getAccount } from '../../_data-access/get-account';

interface EditUserPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditUserPageProps): Promise<Metadata> {
  const account = await getAccount(Number.parseInt((await params).id, 10));

  return { title: account.personName };
}

/** Picks the member's ERP profile. */
export default async function EditUserPage({ params }: EditUserPageProps) {
  if (!(await can('ERP', 'profile:manage'))) {
    return <NoPermission screen="accessControl.users.title" />;
  }

  const id = Number.parseInt((await params).id, 10);
  // The picker needs every profile; a company has a handful.
  const [account, profiles] = await Promise.all([
    getAccount(id),
    listProfiles({ ...EMPTY_LIST_QUERY, pageSize: 100 }),
  ]);

  return (
    <UserProfileForm
      product="ERP"
      account={account}
      profiles={profiles.items}
      setProfileAction={setErpProfileAction}
      basePath={ROUTES.accounts.list}
    />
  );
}
