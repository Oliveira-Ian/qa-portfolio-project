'use client';

import { useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import {
  WORK_ORDER_PRIORITIES,
  emptyWorkOrderFormValues,
  formatAddress,
  formatWorkOrderNumber,
  workOrderToFormValues,
  workOrderWriteSchema,
  type CustomerOptionDto,
  type WorkOrderDto,
  type WorkOrderFormValues,
} from '@oliveira/schemas';
import { FormSection } from '@/components/forms/form-section';
import { RecordForm, SectionBlock } from '@/components/forms/record-form';
import { useEntityForm } from '@/components/forms/use-entity-form';
import { AsyncCombobox } from '@/components/ui/async-combobox';
import { Combobox } from '@/components/ui/combobox';
import { DateTimeField } from '@/components/ui/date-time-field';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import {
  customerEquipmentAction,
  saveWorkOrderAction,
  searchWorkOrderCustomersAction,
  type EquipmentChoice,
} from '../_actions/work-order-actions';
import type { WorkOrderFormOptions } from '../_data-access/work-order-access';

interface WorkOrderFormProps {
  mode: 'create' | 'edit';
  workOrder?: WorkOrderDto;
  /** The chosen customer, with its addresses — the work order's, or one picked from elsewhere. */
  customer?: CustomerOptionDto | null;
  /** That customer's equipment. */
  equipment?: EquipmentChoice[];
  options: WorkOrderFormOptions;
  /** `work-order:assign` — without it, the technician is shown but can't be changed. */
  canAssign: boolean;
}

const routes = ROUTES.fsm.workOrders;

/**
 * Opening and editing a work order. The customer is searched on the server;
 * choosing one brings its addresses and equipment, and choosing an equipment
 * fills in where it is installed. With a technician and a date the work order
 * is scheduled — the API decides, the form only says so.
 */
export function WorkOrderForm({
  mode,
  workOrder,
  customer,
  equipment: initialEquipment = [],
  options,
  canAssign,
}: WorkOrderFormProps) {
  const t = useT();
  const [chosen, setChosen] = useState<CustomerOptionDto | null>(customer ?? null);
  const [equipment, setEquipment] = useState<EquipmentChoice[]>(initialEquipment);
  const loaded = useRef(new Map<string, CustomerOptionDto>());
  const { form, isPending, onSubmit } = useEntityForm<WorkOrderFormValues>(
    zodResolver(workOrderWriteSchema) as Resolver<
      WorkOrderFormValues,
      unknown,
      WorkOrderFormValues
    >,
    workOrder
      ? workOrderToFormValues(workOrder)
      : {
          ...emptyWorkOrderFormValues,
          customerId: customer?.id ?? '',
          serviceAddressId: customer?.addresses.find((address) => address.isPrimary)?.id ?? '',
        },
    (values) => saveWorkOrderAction(values, workOrder?.id),
    {
      message: t(workOrder ? 'fsm.workOrders.form.updated' : 'fsm.workOrders.form.created'),
      href: (id) => (id ? routes.view(id) : routes.list),
    },
  );

  async function chooseCustomer(id: string) {
    const next = loaded.current.get(id);

    if (!next) {
      return;
    }

    setChosen(next);
    form.setValue('customerId', id, {
      shouldDirty: true,
      shouldValidate: form.formState.isSubmitted,
    });
    form.setValue(
      'serviceAddressId',
      next.addresses.find((address) => address.isPrimary)?.id ?? '',
      { shouldDirty: true },
    );
    form.setValue('equipmentId', '', { shouldDirty: true });
    setEquipment(await customerEquipmentAction(id));
  }

  function chooseEquipment(id: string) {
    form.setValue('equipmentId', id, { shouldDirty: true });

    const addressId = equipment.find((item) => item.id === id)?.addressId;

    if (addressId) {
      form.setValue('serviceAddressId', addressId, { shouldDirty: true });
    }
  }

  const addressOptions = [
    { value: '', label: t('fsm.workOrders.form.fields.noAddress') },
    ...(chosen?.addresses ?? []).map((address) => ({
      value: address.id,
      label: address.label
        ? `${address.label} — ${formatAddress(address)}`
        : formatAddress(address),
    })),
  ];
  const equipmentOptions = [
    { value: '', label: t('fsm.workOrders.form.fields.noEquipment') },
    ...equipment.map((item) => ({
      value: item.id,
      label: item.tag ? `${item.tag} · ${item.name}` : item.name,
    })),
  ];
  const typeOptions = options.types.map((type) => ({ value: type.id, label: type.name }));
  const branchOptions = [
    { value: '', label: t('fsm.workOrders.form.fields.noBranch') },
    ...options.branches.map((branch) => ({
      value: branch.id,
      label: `${branch.code} · ${branch.name}`,
    })),
  ];
  const technicianOptions = [
    { value: '', label: t('fsm.workOrders.form.fields.noAssignee') },
    ...options.technicians.map((technician) => ({
      value: technician.membershipId,
      label: technician.name,
    })),
  ];
  // The type of an existing work order may have been deactivated since: keep it choosable.
  if (workOrder && !typeOptions.some((option) => option.value === workOrder.type.id)) {
    typeOptions.push({ value: workOrder.type.id, label: workOrder.type.name });
  }

  /** A field's label with its "i": the explanation lives in a tooltip, not under the field. */
  function labelWithHelp(label: string, help: string, testId: string) {
    return (
      <FormLabel help={help} helpTestId={testId}>
        {label}
      </FormLabel>
    );
  }

  return (
    <RecordForm
      mode={mode}
      form={form}
      onSubmit={onSubmit}
      isPending={isPending}
      testIdPrefix="work-order-form"
      title={
        workOrder
          ? `${formatWorkOrderNumber(workOrder.number)} · ${workOrder.title}`
          : t('fsm.workOrders.form.newTitle')
      }
      {...(workOrder ? {} : { description: t('fsm.workOrders.form.newDescription') })}
      saveLabel={t('fsm.workOrders.form.save')}
      cancelHref={workOrder ? routes.view(workOrder.id) : routes.list}
    >
      <div className="divide-y divide-border">
        <SectionBlock>
          <FormSection title={t('fsm.workOrders.form.sections.customer.title')}>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem required>
                    <FormLabel>{t('fsm.workOrders.form.fields.customer')}</FormLabel>
                    <FormControl>
                      <AsyncCombobox
                        value={field.value || null}
                        selectedLabel={chosen?.name ?? null}
                        loadOptions={async (search) => {
                          const found = await searchWorkOrderCustomersAction(search);

                          for (const option of found) {
                            loaded.current.set(option.id, option);
                          }

                          return found.map((option) => ({
                            value: option.id,
                            label: option.name,
                            description: option.document,
                          }));
                        }}
                        onChange={(value) => void chooseCustomer(value)}
                        disabled={
                          mode === 'edit' &&
                          workOrder !== undefined &&
                          !['OPEN', 'SCHEDULED'].includes(workOrder.status)
                        }
                        placeholder={t('fsm.workOrders.form.fields.customerPlaceholder')}
                        emptyText={t('fsm.workOrders.form.fields.customerEmpty')}
                        data-testid="work-order-form-customer"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="equipmentId"
                render={({ field }) => (
                  <FormItem>
                    {labelWithHelp(
                      t('fsm.workOrders.form.fields.equipment'),
                      t('fsm.workOrders.form.help.equipment'),
                      'work-order-form-help-equipment',
                    )}
                    <FormControl>
                      <Combobox
                        options={equipmentOptions}
                        value={field.value}
                        onChange={chooseEquipment}
                        disabled={!chosen}
                        placeholder={t('fsm.workOrders.form.fields.equipmentPlaceholder')}
                        data-testid="work-order-form-equipment"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serviceAddressId"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t('fsm.workOrders.form.fields.address')}</FormLabel>
                    <FormControl>
                      <Combobox
                        options={addressOptions}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={!chosen}
                        placeholder={t('fsm.workOrders.form.fields.addressPlaceholder')}
                        data-testid="work-order-form-address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </FormSection>
        </SectionBlock>

        <SectionBlock>
          <FormSection title={t('fsm.workOrders.form.sections.job.title')}>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="typeId"
                render={({ field }) => (
                  <FormItem required>
                    <FormLabel>{t('fsm.workOrders.form.fields.type')}</FormLabel>
                    <FormControl>
                      <Combobox
                        options={typeOptions}
                        value={field.value || null}
                        onChange={field.onChange}
                        placeholder={t('fsm.workOrders.form.fields.typePlaceholder')}
                        data-testid="work-order-form-type"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem required>
                    <FormLabel>{t('fsm.workOrders.form.fields.priority')}</FormLabel>
                    <FormControl>
                      {/* Four equal segments filling the column — never wider than it. */}
                      <ToggleGroup
                        type="single"
                        variant="outline"
                        value={field.value}
                        onValueChange={(value) => value && field.onChange(value)}
                        className="grid w-full grid-cols-4"
                        data-testid="work-order-form-priority"
                      >
                        {WORK_ORDER_PRIORITIES.map((priority) => (
                          <ToggleGroupItem
                            key={priority}
                            value={priority}
                            className="min-w-0 px-2"
                            data-testid={`work-order-form-priority-${priority.toLowerCase()}`}
                          >
                            <span className="truncate">
                              {t(`fsm.workOrders.priority.${priority}`)}
                            </span>
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="md:col-span-2" required>
                    <FormLabel>{t('fsm.workOrders.form.fields.title')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        autoComplete="off"
                        placeholder={t('fsm.workOrders.form.fields.titlePlaceholder')}
                        data-testid="work-order-form-input-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t('fsm.workOrders.form.fields.description')}</FormLabel>
                    <FormControl>
                      {/* No resize handle: it grows with the text up to a limit, then scrolls. */}
                      <Textarea
                        {...field}
                        rows={4}
                        className="min-h-28"
                        placeholder={t('fsm.workOrders.form.fields.descriptionPlaceholder')}
                        data-testid="work-order-form-input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </FormSection>
        </SectionBlock>

        <SectionBlock>
          <FormSection title={t('fsm.workOrders.form.sections.planning.title')}>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              <FormField
                control={form.control}
                name="assigneeMembershipId"
                render={({ field }) => (
                  <FormItem>
                    {labelWithHelp(
                      t('fsm.workOrders.form.fields.assignee'),
                      t('fsm.workOrders.form.help.assignee'),
                      'work-order-form-help-assignee',
                    )}
                    <FormControl>
                      <Combobox
                        options={technicianOptions}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={!canAssign}
                        data-testid="work-order-form-assignee"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fsm.workOrders.form.fields.branch')}</FormLabel>
                    <FormControl>
                      <Combobox
                        options={branchOptions}
                        value={field.value}
                        onChange={field.onChange}
                        data-testid="work-order-form-branch"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {(['scheduledAt', 'dueAt'] as const).map((name) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      {labelWithHelp(
                        t(`fsm.workOrders.form.fields.${name}`),
                        t(`fsm.workOrders.form.help.${name}`),
                        `work-order-form-help-${name}`,
                      )}
                      <FormControl>
                        <DateTimeField
                          value={field.value}
                          onChange={field.onChange}
                          datePlaceholder={t('common.pickDate')}
                          timeLabel={t('fsm.workOrders.form.fields.time')}
                          data-testid={`work-order-form-${name}`}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </FormSection>
        </SectionBlock>
      </div>
    </RecordForm>
  );
}
