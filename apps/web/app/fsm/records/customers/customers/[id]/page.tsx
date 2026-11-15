import type { Metadata } from 'next';
import { NoPermission } from '@/components/platform/no-permission';
import { EMPTY_LIST_QUERY } from '@/lib/list-query';
import { can } from '@/lib/permissions';
import { listWorkOrders } from '../../../../operations/work-orders/work-orders/_data-access/work-order-access';
import { equipmentAccess } from '../../equipment/_data-access/equipment-access';
import { CustomerRecord, type CustomerTab } from '../_components/customer-record';
import { customerAccess } from '../_data-access/customer-access';

interface CustomerPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const TABS: readonly CustomerTab[] = [
  'overview',
  'details',
  'sites',
  'contacts',
  'equipment',
  'work-orders',
];

export async function generateMetadata({ params }: CustomerPageProps): Promise<Metadata> {
  if (!(await can('FSM', 'customer:view'))) {
    return {};
  }

  return { title: (await customerAccess.get((await params).id)).person.name };
}

/** The customer, on the tab the URL names (`?tab=`): its equipment and work orders come with it. */
export default async function CustomerPage({ params, searchParams }: CustomerPageProps) {
  if (!(await can('FSM', 'customer:view'))) {
    return <NoPermission product="FSM" screen="nav.fsm.customers" />;
  }

  const { id } = await params;
  const requested = (await searchParams).tab;
  const [
    customer,
    canEdit,
    canViewEquipment,
    canAddEquipment,
    canViewWorkOrders,
    canCreateWorkOrder,
  ] = await Promise.all([
    customerAccess.get(id),
    can('FSM', 'customer:edit'),
    can('FSM', 'equipment:view'),
    can('FSM', 'equipment:create'),
    can('FSM', 'work-order:view'),
    can('FSM', 'work-order:create'),
  ]);
  const [equipment, workOrders] = await Promise.all([
    canViewEquipment
      ? equipmentAccess
          .list({ ...EMPTY_LIST_QUERY, pageSize: 100 }, { customerId: id })
          .then((page) => page.items)
      : Promise.resolve([]),
    canViewWorkOrders
      ? listWorkOrders({ ...EMPTY_LIST_QUERY, pageSize: 100 }, { customerId: id }).then(
          (page) => page.items,
        )
      : Promise.resolve(null),
  ]);
  const available = TABS.filter(
    (tab) =>
      (tab !== 'equipment' || canViewEquipment) && (tab !== 'work-orders' || canViewWorkOrders),
  );

  return (
    <CustomerRecord
      customer={customer}
      equipment={equipment}
      workOrders={workOrders}
      tab={available.find((tab) => tab === requested) ?? 'overview'}
      now={new Date().toISOString()}
      can={{
        edit: canEdit,
        createWorkOrder: canCreateWorkOrder,
        addEquipment: canAddEquipment,
        viewEquipment: canViewEquipment,
      }}
    />
  );
}
