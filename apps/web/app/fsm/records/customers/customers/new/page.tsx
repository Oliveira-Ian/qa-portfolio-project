import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslator } from '@/lib/i18n/server';
import { ROUTES } from '@/lib/navigation/routes';
import { can } from '@/lib/permissions';
import { CustomerForm } from '../_components/customer-form';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('fsm.customers.form.newTitle') };
}

export default async function NewCustomerPage() {
  if (!(await can('FSM', 'customer:create'))) {
    redirect(ROUTES.fsm.customers.list);
  }

  return <CustomerForm mode="create" />;
}
