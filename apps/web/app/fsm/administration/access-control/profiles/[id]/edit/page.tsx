import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ProfileForm } from '@/components/profiles/profile-form';
import { ROUTES } from '@/lib/navigation/routes';
import { can } from '@/lib/permissions';
import { saveProfileAction } from '../../_actions/profile-actions';
import { profileAccess } from '../../_data-access/profile-access';

interface EditProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditProfilePageProps): Promise<Metadata> {
  if (!(await can('FSM', 'profile:manage'))) {
    return {};
  }

  return { title: (await profileAccess.get(Number.parseInt((await params).id, 10))).name };
}

export default async function EditProfilePage({ params }: EditProfilePageProps) {
  const id = Number.parseInt((await params).id, 10);

  if (!(await can('FSM', 'profile:manage'))) {
    redirect(ROUTES.fsm.profiles.list);
  }

  const [profile, permissions] = await Promise.all([
    profileAccess.get(id),
    profileAccess.permissions(),
  ]);

  return (
    <ProfileForm
      product="FSM"
      mode="edit"
      profile={profile}
      permissions={permissions}
      saveAction={saveProfileAction}
    />
  );
}
