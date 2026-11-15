import type { Metadata } from 'next';
import { NoPermission } from '@/components/platform/no-permission';
import { EMPTY_LIST_QUERY } from '@/lib/list-query';
import { can } from '@/lib/permissions';
import { listWorkOrders } from '../../../../operations/work-orders/work-orders/_data-access/work-order-access';
import { EquipmentForm } from '../_components/equipment-form';
import { equipmentAccess } from '../_data-access/equipment-access';

interface EquipmentRecordPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EquipmentRecordPageProps): Promise<Metadata> {
  if (!(await can('FSM', 'equipment:view'))) {
    return {};
  }

  return { title: (await equipmentAccess.get((await params).id)).name };
}

export default async function EquipmentRecordPage({ params }: EquipmentRecordPageProps) {
  if (!(await can('FSM', 'equipment:view'))) {
    return <NoPermission product="FSM" screen="nav.fsm.equipment" />;
  }

  const { id } = await params;
  const [equipment, canEdit, canViewWorkOrders] = await Promise.all([
    equipmentAccess.get(id),
    can('FSM', 'equipment:edit'),
    can('FSM', 'work-order:view'),
  ]);
  const workOrders = canViewWorkOrders
    ? (await listWorkOrders({ ...EMPTY_LIST_QUERY, pageSize: 20 }, { equipmentId: id })).items
    : null;
  // The view needs only the address the equipment is at, not the customer's others.
  const customer = {
    id: equipment.customer.id,
    name: equipment.customer.name,
    document: null,
    addresses: equipment.address ? [equipment.address] : [],
    contacts: [],
    serviceInstructions: null,
    defaultBranchId: null,
    openWorkOrderCount: equipment.openWorkOrderCount,
  };

  return (
    <EquipmentForm
      mode="view"
      equipment={equipment}
      customer={customer}
      canEdit={canEdit}
      workOrders={workOrders}
    />
  );
}
