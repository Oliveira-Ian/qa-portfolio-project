import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ProfileForm } from '@/components/profiles/profile-form';
import { getTranslator } from '@/lib/i18n/server';
import { ROUTES } from '@/lib/navigation/routes';
import { can } from '@/lib/permissions';
import { saveProfileAction } from '../_actions/profile-actions';
import { profileAccess } from '../_data-access/profile-access';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('accessControl.profiles.form.newTitle') };
}

export default async function NewProfilePage() {
  if (!(await can('FSM', 'profile:manage'))) {
    redirect(ROUTES.fsm.profiles.list);
  }

  return (
    <ProfileForm
      product="FSM"
      mode="create"
      permissions={await profileAccess.permissions()}
      saveAction={saveProfileAction}
    />
  );
}
