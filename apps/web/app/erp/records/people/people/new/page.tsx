import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/navigation/routes';
import { can } from '@/lib/permissions';
import { CreatePersonForm } from './_components/create-person-form';

export const metadata: Metadata = {
  title: 'New person',
};

export default async function NewPersonPage() {
  if (!(await can('person:create'))) {
    redirect(ROUTES.people.list);
  }

  return <CreatePersonForm />;
}
