import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/navigation/routes';
import { can } from '@/lib/permissions';
import { EquipmentForm } from '../../_components/equipment-form';
import { getCustomerOption } from '../../_data-access/customer-options';
import { equipmentAccess } from '../../_data-access/equipment-access';

interface EditEquipmentPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditEquipmentPageProps): Promise<Metadata> {
  if (!(await can('FSM', 'equipment:edit'))) {
    return {};
  }

  return { title: (await equipmentAccess.get((await params).id)).name };
}

export default async function EditEquipmentPage({ params }: EditEquipmentPageProps) {
  const { id } = await params;

  if (!(await can('FSM', 'equipment:edit'))) {
    redirect(ROUTES.fsm.equipment.view(id));
  }

  const equipment = await equipmentAccess.get(id);
  // The customer's addresses as they are now: the choices for where it is installed.
  const customer = await getCustomerOption(equipment.customer.id);

  return <EquipmentForm mode="edit" equipment={equipment} customer={customer} />;
}
