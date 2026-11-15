import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslator } from '@/lib/i18n/server';
import { ROUTES } from '@/lib/navigation/routes';
import { can } from '@/lib/permissions';
import { customerEquipmentAction } from '../_actions/work-order-actions';
import { WorkOrderForm } from '../_components/work-order-form';
import { getCustomerOption, getWorkOrderFormOptions } from '../_data-access/work-order-access';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('fsm.workOrders.form.newTitle') };
}

interface NewWorkOrderPageProps {
  searchParams: Promise<{ customerId?: string }>;
}

/** Opened from a customer's sheet, the customer comes chosen (`?customerId=`). */
export default async function NewWorkOrderPage({ searchParams }: NewWorkOrderPageProps) {
  if (!(await can('FSM', 'work-order:create'))) {
    redirect(ROUTES.fsm.workOrders.list);
  }

  const { customerId } = await searchParams;
  const [options, customer, canAssign] = await Promise.all([
    getWorkOrderFormOptions(),
    customerId ? getCustomerOption(customerId) : null,
    can('FSM', 'work-order:assign'),
  ]);
  const equipment = customer ? await customerEquipmentAction(customer.id) : [];

  return (
    <WorkOrderForm
      mode="create"
      customer={customer}
      equipment={equipment}
      options={options}
      canAssign={canAssign}
    />
  );
}
