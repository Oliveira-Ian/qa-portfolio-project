'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Wrench } from 'lucide-react';
import type { Resolver } from 'react-hook-form';
import {
  customerFormSchema,
  customerToFormValues,
  emptyCustomerFormValues,
  type CustomerDto,
  type CustomerFormValues,
  type EquipmentDto,
  type WorkOrderListItemDto,
} from '@oliveira/schemas';
import { FormSection } from '@/components/forms/form-section';
import { WorkOrderSummaryList } from '@/components/fsm/work-order-summary-list';
import { RecordForm, SectionBlock, type RecordFormMode } from '@/components/forms/record-form';
import { useEntityForm } from '@/components/forms/use-entity-form';
import { PersonFormFields } from '@/components/people/person-form-fields';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import { saveCustomerAction } from '../_actions/customer-actions';

interface CustomerFormProps {
  mode: RecordFormMode;
  customer?: CustomerDto;
  canEdit?: boolean;
  /** View mode: the customer's equipment, and whether one can be added from here. */
  equipment?: EquipmentDto[];
  canAddEquipment?: boolean;
  /** View mode: the customer's work orders — `null` without `work-order:view`. */
  workOrders?: WorkOrderListItemDto[] | null;
  canOpenWorkOrder?: boolean;
}

const routes = ROUTES.fsm.customers;

/**
 * A customer in its three modes. The fields are the person record's
 * (`PersonFormFields`, the ERP's own layout) without the ERP's types; the
 * view adds what the FSM knows about the customer — its equipment.
 */
export function CustomerForm({
  mode,
  customer,
  canEdit = false,
  equipment = [],
  canAddEquipment = false,
  workOrders = null,
  canOpenWorkOrder = false,
}: CustomerFormProps) {
  const t = useT();
  const { form, isPending, onSubmit } = useEntityForm<CustomerFormValues>(
    zodResolver(customerFormSchema) as Resolver<CustomerFormValues, unknown, CustomerFormValues>,
    customer ? customerToFormValues(customer) : emptyCustomerFormValues,
    (values) => saveCustomerAction(values, customer?.id),
    {
      message: t(customer ? 'fsm.customers.form.updated' : 'fsm.customers.form.created'),
      href: (id) => (id ? routes.view(id) : routes.list),
    },
  );

  return (
    <RecordForm
      mode={mode}
      form={form}
      onSubmit={onSubmit}
      isPending={isPending}
      testIdPrefix="customer-form"
      title={customer?.person.name ?? t('fsm.customers.form.newTitle')}
      {...(customer ? {} : { description: t('fsm.customers.form.newDescription') })}
      saveLabel={t('fsm.customers.form.save')}
      cancelHref={customer && mode === 'edit' ? routes.view(customer.id) : routes.list}
      {...(customer && canEdit ? { editHref: routes.edit(customer.id) } : {})}
      {...(customer
        ? {
            badges: (
              <StatusBadge tone={customer.person.active ? 'success' : 'neutral'}>
                {t(customer.person.active ? 'common.active' : 'common.inactive')}
              </StatusBadge>
            ),
          }
        : {})}
      {...(mode === 'view' && customer
        ? {
            after: (
              <div className="border-t border-border">
                <SectionBlock>
                  <FormSection
                    title={t('fsm.customers.record.equipment')}
                    description={t('fsm.customers.record.equipmentBody')}
                  >
                    <CustomerEquipment
                      customerId={customer.id}
                      equipment={equipment}
                      canAdd={canAddEquipment}
                    />
                  </FormSection>
                </SectionBlock>
                {workOrders ? (
                  <div className="border-t border-border">
                    <SectionBlock>
                      <FormSection
                        title={t('fsm.customers.record.workOrders')}
                        description={t('fsm.customers.record.workOrdersBody')}
                      >
                        <WorkOrderSummaryList
                          workOrders={workOrders}
                          emptyText={t('fsm.customers.record.noWorkOrders')}
                          testId="customer-work-orders"
                          {...(canOpenWorkOrder
                            ? {
                                newHref: `${ROUTES.fsm.workOrders.new}?customerId=${encodeURIComponent(customer.id)}`,
                              }
                            : {})}
                        />
                      </FormSection>
                    </SectionBlock>
                  </div>
                ) : null}
              </div>
            ),
          }
        : {})}
    >
      <PersonFormFields disabled={mode === 'view'} variant="customer" />
    </RecordForm>
  );
}

function CustomerEquipment({
  customerId,
  equipment,
  canAdd,
}: {
  customerId: string;
  equipment: EquipmentDto[];
  canAdd: boolean;
}) {
  const t = useT();

  return (
    <div className="grid gap-3" data-testid="customer-equipment">
      {equipment.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-4 py-5 text-center text-sm text-text-3">
          {t('fsm.customers.record.noEquipment')}
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {equipment.map((item) => (
            <li key={item.id}>
              <Link
                href={ROUTES.fsm.equipment.view(item.id)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2 focus-visible:ring-focus"
                data-testid={`customer-equipment-${item.id}`}
              >
                <Wrench className="size-4 shrink-0 text-text-3" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{item.name}</span>
                  <span className="block truncate text-xs text-text-3">
                    {[
                      item.tag,
                      item.manufacturer,
                      item.model,
                      item.address?.label ?? item.address?.city,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
                <StatusBadge
                  tone={
                    item.status === 'ACTIVE'
                      ? 'success'
                      : item.status === 'UNDER_MAINTENANCE'
                        ? 'warning'
                        : 'neutral'
                  }
                >
                  {t(`fsm.equipment.status.${item.status}`)}
                </StatusBadge>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {canAdd ? (
        <div>
          <Button asChild variant="create" size="sm" data-testid="customer-equipment-add">
            <Link href={`${ROUTES.fsm.equipment.new}?customerId=${encodeURIComponent(customerId)}`}>
              <Plus aria-hidden="true" />
              {t('fsm.customers.record.addEquipment')}
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
