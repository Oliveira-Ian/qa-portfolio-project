import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { EMPTY_LIST_QUERY, parseListQuery, toURLSearchParams } from '@/lib/list-query';
import { isAdmin } from '@/lib/permissions';
import { AccountList } from './_components/account-list';
import { ACCOUNT_FILTERABLE_COLUMNS } from './_components/account-filter-fields';
import { getAccountGridPreference } from './_data-access/get-grid-preferences';
import { listAccounts } from './_data-access/list-accounts';
import { listProfiles } from '../profiles/_data-access/list-profiles';

export const metadata: Metadata = {
  title: 'Users',
};

interface UsersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  if (!(await isAdmin())) {
    redirect('/home');
  }

  const query = parseListQuery(toURLSearchParams(await searchParams), ACCOUNT_FILTERABLE_COLUMNS);

  const [accountsResult, profilesResult, gridPreference] = await Promise.all([
    listAccounts(query),
    // The "manage profiles" picker needs every profile, not one page of
    // them — profiles are a small, admin-managed catalog (not a business
    // table like Person), so a generous single page from the same
    // paginated endpoint covers it without a second, unpaginated one.
    listProfiles({ ...EMPTY_LIST_QUERY, pageSize: 100 }),
    getAccountGridPreference(),
  ]);

  return (
    <AccountList
      accounts={accountsResult.items}
      total={accountsResult.total}
      profiles={profilesResult.items}
      gridPreference={gridPreference}
    />
  );
}
