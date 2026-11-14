import type { Metadata } from 'next';
import { NoPermission } from '@/components/platform/no-permission';
import { can } from '@/lib/permissions';
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

  const [equipment, canEdit] = await Promise.all([
    equipmentAccess.get((await params).id),
    can('FSM', 'equipment:edit'),
  ]);
  // The view needs only the address the equipment is at, not the customer's others.
  const customer = {
    id: equipment.customer.id,
    name: equipment.customer.name,
    document: null,
    addresses: equipment.address ? [equipment.address] : [],
  };

  return <EquipmentForm mode="view" equipment={equipment} customer={customer} canEdit={canEdit} />;
}
