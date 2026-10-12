import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslator } from '@/lib/i18n/server';
import { ROUTES } from '@/lib/navigation/routes';
import { can } from '@/lib/permissions';
import { CreatePersonForm } from './_components/create-person-form';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('erp.people.form.newTitle') };
}

export default async function NewPersonPage() {
  if (!(await can('person:create'))) {
    redirect(ROUTES.people.list);
  }

  return <CreatePersonForm />;
}
