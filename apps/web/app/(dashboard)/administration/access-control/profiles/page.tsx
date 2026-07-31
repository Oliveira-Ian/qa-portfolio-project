import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { parseListQuery, toURLSearchParams } from '@/lib/list-query';
import { isAdmin } from '@/lib/permissions';
import { ProfileList } from './_components/profile-list';
import { PROFILE_FILTERABLE_COLUMNS } from './_components/profile-filter-fields';
import { getProfileGridPreference } from './_data-access/get-grid-preferences';
import { listProfiles } from './_data-access/list-profiles';

export const metadata: Metadata = {
  title: 'Profiles',
};

interface ProfilesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProfilesPage({ searchParams }: ProfilesPageProps) {
  if (!(await isAdmin())) {
    redirect('/home');
  }

  const query = parseListQuery(toURLSearchParams(await searchParams), PROFILE_FILTERABLE_COLUMNS);

  const [result, gridPreference] = await Promise.all([
    listProfiles(query),
    getProfileGridPreference(),
  ]);

  return (
    <ProfileList profiles={result.items} total={result.total} gridPreference={gridPreference} />
  );
}
