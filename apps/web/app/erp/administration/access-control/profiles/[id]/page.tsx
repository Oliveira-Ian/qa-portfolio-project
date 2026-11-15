import type { Metadata } from 'next';
import { ProfileForm } from '@/components/profiles/profile-form';
import { NoPermission } from '@/components/platform/no-permission';
import { can } from '@/lib/permissions';
import { profileAccess } from '../_data-access/profile-access';

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  if (!(await can('ERP', 'profile:manage'))) {
    return {};
  }

  return { title: (await profileAccess.get(Number.parseInt((await params).id, 10))).name };
}

/** One profile, read-only — what a double click on the list opens. */
export default async function ProfilePage({ params }: ProfilePageProps) {
  if (!(await can('ERP', 'profile:manage'))) {
    return <NoPermission screen="accessControl.profiles.title" />;
  }

  const [profile, permissions] = await Promise.all([
    profileAccess.get(Number.parseInt((await params).id, 10)),
    profileAccess.permissions(),
  ]);

  return <ProfileForm product="ERP" mode="view" profile={profile} permissions={permissions} />;
}
