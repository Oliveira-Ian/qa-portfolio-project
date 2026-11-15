import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslator } from '@/lib/i18n/server';
import { ROUTES } from '@/lib/navigation/routes';
import { can } from '@/lib/permissions';
import { EquipmentForm } from '../_components/equipment-form';
import { getCustomerOption } from '../_data-access/customer-options';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('fsm.equipment.form.newTitle') };
}

interface NewEquipmentPageProps {
  searchParams: Promise<{ customerId?: string }>;
}

/** Opened from a customer's sheet, the customer comes chosen (`?customerId=`). */
export default async function NewEquipmentPage({ searchParams }: NewEquipmentPageProps) {
  if (!(await can('FSM', 'equipment:create'))) {
    redirect(ROUTES.fsm.equipment.list);
  }

  const { customerId } = await searchParams;
  const customer = customerId ? await getCustomerOption(customerId) : null;

  return <EquipmentForm mode="create" customer={customer} />;
}
