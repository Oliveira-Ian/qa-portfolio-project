import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/permissions';
import { EditProfileForm } from './_components/edit-profile-form';
import { getProfile } from '../_data-access/get-profile';
import { listPermissions } from '../../_data-access/list-permissions';

export const metadata: Metadata = {
  title: 'Edit profile',
};

interface EditProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProfilePage({ params }: EditProfilePageProps) {
  if (!(await isAdmin())) {
    redirect('/home');
  }

  const { id } = await params;
  const [profile, permissions] = await Promise.all([
    getProfile(Number.parseInt(id, 10)),
    listPermissions(),
  ]);

  return <EditProfileForm profile={profile} permissions={permissions} />;
}
