import type { Metadata } from 'next';
import { NoPermission } from '@/components/platform/no-permission';
import { EMPTY_LIST_QUERY } from '@/lib/list-query';
import { can } from '@/lib/permissions';
import { equipmentAccess } from '../../equipment/_data-access/equipment-access';
import { CustomerForm } from '../_components/customer-form';
import { customerAccess } from '../_data-access/customer-access';

interface CustomerPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CustomerPageProps): Promise<Metadata> {
  if (!(await can('FSM', 'customer:view'))) {
    return {};
  }

  return { title: (await customerAccess.get((await params).id)).person.name };
}

/** The customer's sheet, with its equipment underneath. */
export default async function CustomerPage({ params }: CustomerPageProps) {
  if (!(await can('FSM', 'customer:view'))) {
    return <NoPermission product="FSM" screen="nav.fsm.customers" />;
  }

  const { id } = await params;
  const [customer, canEdit, canViewEquipment, canAddEquipment] = await Promise.all([
    customerAccess.get(id),
    can('FSM', 'customer:edit'),
    can('FSM', 'equipment:view'),
    can('FSM', 'equipment:create'),
  ]);
  const equipment = canViewEquipment
    ? (await equipmentAccess.list({ ...EMPTY_LIST_QUERY, pageSize: 100 }, { customerId: id })).items
    : [];

  return (
    <CustomerForm
      mode="view"
      customer={customer}
      canEdit={canEdit}
      equipment={equipment}
      canAddEquipment={canAddEquipment}
    />
  );
}
