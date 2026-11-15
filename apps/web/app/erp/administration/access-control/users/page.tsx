import type { Metadata } from 'next';
import { UserList } from '@/components/access-control/user-list';
import { USER_FILTERABLE_COLUMNS } from '@/components/access-control/user-filter-fields';
import { NoPermission } from '@/components/platform/no-permission';
import { getTranslator } from '@/lib/i18n/server';
import { parseListQuery, toURLSearchParams } from '@/lib/list-query';
import { ROUTES } from '@/lib/navigation/routes';
import { can } from '@/lib/permissions';
import { getProfileFilterOptions } from '@/lib/profile-filter-options';
import { saveAccountGridPreferenceAction } from './_actions/save-grid-preferences';
import { getAccountGridPreference } from './_data-access/get-grid-preferences';
import { listAccounts } from './_data-access/list-accounts';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('accessControl.users.title') };
}

interface UsersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** The ERP's users — every member of the company, with the one ERP profile each holds. */
export default async function UsersPage({ searchParams }: UsersPageProps) {
  if (!(await can('ERP', 'profile:manage'))) {
    return <NoPermission screen="accessControl.users.title" />;
  }

  const query = parseListQuery(toURLSearchParams(await searchParams), USER_FILTERABLE_COLUMNS);
  const [accounts, gridPreference, profileOptions] = await Promise.all([
    listAccounts(query),
    getAccountGridPreference(),
    getProfileFilterOptions('ERP'),
  ]);

  return (
    <UserList
      product="ERP"
      accounts={accounts.items}
      total={accounts.total}
      gridPreference={gridPreference}
      saveGridPreferenceAction={saveAccountGridPreferenceAction}
      profileOptions={profileOptions}
      basePath={ROUTES.accounts.list}
    />
  );
}
