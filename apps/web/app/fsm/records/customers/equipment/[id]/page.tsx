import type { Metadata } from 'next';
import { NoPermission } from '@/components/platform/no-permission';
import { EMPTY_LIST_QUERY } from '@/lib/list-query';
import { can } from '@/lib/permissions';
import { listWorkOrders } from '../../../../operations/work-orders/work-orders/_data-access/work-order-access';
import { EquipmentRecord, type EquipmentTab } from '../_components/equipment-record';
import { equipmentAccess } from '../_data-access/equipment-access';

interface EquipmentRecordPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const TABS: readonly EquipmentTab[] = ['overview', 'details', 'history'];

export async function generateMetadata({ params }: EquipmentRecordPageProps): Promise<Metadata> {
  if (!(await can('FSM', 'equipment:view'))) {
    return {};
  }

  return { title: (await equipmentAccess.get((await params).id)).name };
}

/** The equipment, on the tab the URL names (`?tab=`), with its work orders. */
export default async function EquipmentRecordPage({
  params,
  searchParams,
}: EquipmentRecordPageProps) {
  if (!(await can('FSM', 'equipment:view'))) {
    return <NoPermission product="FSM" screen="nav.fsm.equipment" />;
  }

  const { id } = await params;
  const requested = (await searchParams).tab;
  const [equipment, canEdit, canViewWorkOrders, canCreateWorkOrder] = await Promise.all([
    equipmentAccess.get(id),
    can('FSM', 'equipment:edit'),
    can('FSM', 'work-order:view'),
    can('FSM', 'work-order:create'),
  ]);
  const workOrders = canViewWorkOrders
    ? (await listWorkOrders({ ...EMPTY_LIST_QUERY, pageSize: 100 }, { equipmentId: id })).items
    : null;
  const tab =
    TABS.find((value) => value === requested && (value !== 'history' || workOrders)) ?? 'overview';

  return (
    <EquipmentRecord
      equipment={equipment}
      workOrders={workOrders}
      tab={tab}
      now={new Date().toISOString()}
      can={{ edit: canEdit, createWorkOrder: canCreateWorkOrder }}
    />
  );
}
