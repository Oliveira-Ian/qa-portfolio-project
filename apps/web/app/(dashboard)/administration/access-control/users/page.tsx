import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/permissions';
import { AccountList } from './_components/account-list';
import { getAccountGridPreference } from './_data-access/get-grid-preferences';
import { listAccounts } from './_data-access/list-accounts';
import { listProfiles } from '../profiles/_data-access/list-profiles';

export const metadata: Metadata = {
  title: 'Users',
};

export default async function UsersPage() {
  if (!(await isAdmin())) {
    redirect('/home');
  }

  const [accounts, profiles, gridPreference] = await Promise.all([
    listAccounts(),
    listProfiles(),
    getAccountGridPreference(),
  ]);

  return <AccountList accounts={accounts} profiles={profiles} gridPreference={gridPreference} />;
}
