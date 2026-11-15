import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { formatWorkOrderNumber, isFinalStatus } from '@oliveira/schemas';
import { ROUTES } from '@/lib/navigation/routes';
import { can } from '@/lib/permissions';
import { getFsmDashboardIfAllowed } from '@/app/fsm/_data-access/get-dashboard';
import { customerEquipmentAction } from '../../_actions/work-order-actions';
import { WorkOrderForm } from '../../_components/work-order-form';
import {
  getCustomerOption,
  getWorkOrder,
  getWorkOrderFormOptions,
} from '../../_data-access/work-order-access';

interface EditWorkOrderPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditWorkOrderPageProps): Promise<Metadata> {
  if (!(await can('FSM', 'work-order:edit'))) {
    return {};
  }

  const workOrder = await getWorkOrder((await params).id);

  return { title: `${formatWorkOrderNumber(workOrder.number)} · ${workOrder.title}` };
}

/** A finished work order is history: its page has no Edit, and this route sends back to it. */
export default async function EditWorkOrderPage({ params }: EditWorkOrderPageProps) {
  const { id } = await params;

  if (!(await can('FSM', 'work-order:edit'))) {
    redirect(ROUTES.fsm.workOrders.view(id));
  }

  const workOrder = await getWorkOrder(id);

  if (isFinalStatus(workOrder.status)) {
    redirect(ROUTES.fsm.workOrders.view(id));
  }

  const [options, customer, equipment, canAssign] = await Promise.all([
    getWorkOrderFormOptions(),
    getCustomerOption(workOrder.customer.id),
    customerEquipmentAction(workOrder.customer.id),
    can('FSM', 'work-order:assign'),
  ]);

  const dashboard = await getFsmDashboardIfAllowed();
  const technicianLoad = Object.fromEntries(
    (dashboard?.teamLoad ?? []).map((row) => [row.membershipId, row.open]),
  );

  return (
    <WorkOrderForm
      mode="edit"
      workOrder={workOrder}
      customer={customer}
      equipment={equipment}
      options={options}
      canAssign={canAssign}
      technicianLoad={technicianLoad}
    />
  );
}
