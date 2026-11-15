import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/navigation/routes';
import { can } from '@/lib/permissions';
import { CustomerForm } from '../../_components/customer-form';
import { customerAccess } from '../../_data-access/customer-access';

interface EditCustomerPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditCustomerPageProps): Promise<Metadata> {
  if (!(await can('FSM', 'customer:edit'))) {
    return {};
  }

  return { title: (await customerAccess.get((await params).id)).person.name };
}

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { id } = await params;

  if (!(await can('FSM', 'customer:edit'))) {
    redirect(ROUTES.fsm.customers.view(id));
  }

  return <CustomerForm mode="edit" customer={await customerAccess.get(id)} />;
}
