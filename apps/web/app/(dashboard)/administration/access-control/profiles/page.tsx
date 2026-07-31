import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/permissions';
import { ProfileList } from './_components/profile-list';
import { getProfileGridPreference } from './_data-access/get-grid-preferences';
import { listProfiles } from './_data-access/list-profiles';

export const metadata: Metadata = {
  title: 'Profiles',
};

export default async function ProfilesPage() {
  if (!(await isAdmin())) {
    redirect('/home');
  }

  const [profiles, gridPreference] = await Promise.all([
    listProfiles(),
    getProfileGridPreference(),
  ]);

  return <ProfileList profiles={profiles} gridPreference={gridPreference} />;
}
