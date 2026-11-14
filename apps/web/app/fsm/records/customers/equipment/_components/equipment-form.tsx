'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  EQUIPMENT_STATUSES,
  emptyEquipmentFormValues,
  equipmentToFormValues,
  equipmentWriteSchema,
  formatAddress,
  type AddressDto,
  type CustomerOptionDto,
  type EquipmentDto,
  type EquipmentFormValues,
} from '@oliveira/schemas';
import { FormSection } from '@/components/forms/form-section';
import { RecordForm, SectionBlock, type RecordFormMode } from '@/components/forms/record-form';
import { useEntityForm } from '@/components/forms/use-entity-form';
import { AsyncCombobox } from '@/components/ui/async-combobox';
import { Combobox } from '@/components/ui/combobox';
import { DatePicker } from '@/components/ui/date-picker';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import { saveEquipmentAction, searchCustomerOptionsAction } from '../_actions/equipment-actions';
import { EquipmentStatusBadge } from './equipment-status-badge';

interface EquipmentFormProps {
  mode: RecordFormMode;
  equipment?: EquipmentDto;
  /** The chosen customer, with its addresses — the record's, or one picked from a customer's sheet. */
  customer?: CustomerOptionDto | null;
  canEdit?: boolean;
}

const routes = ROUTES.fsm.equipment;

type TextField =
  'name' | 'tag' | 'category' | 'manufacturer' | 'model' | 'serialNumber' | 'location';

function addressLabel(address: AddressDto): string {
  const place = formatAddress(address);

  return address.label ? `${address.label} — ${place}` : place;
}

/**
 * A customer's equipment in its three modes. The customer is searched on the
 * server; its addresses become the choices for where the equipment is
 * installed, and changing the customer clears that choice.
 */
export function EquipmentForm({ mode, equipment, customer, canEdit = false }: EquipmentFormProps) {
  const t = useT();
  const disabled = mode === 'view';
  const [chosen, setChosen] = useState<CustomerOptionDto | null>(customer ?? null);
  // The customers the picker loaded, by id — choosing one brings its addresses.
  const loaded = useRef(new Map<string, CustomerOptionDto>());
  const { form, isPending, onSubmit } = useEntityForm<EquipmentFormValues>(
    zodResolver(equipmentWriteSchema),
    equipment
      ? equipmentToFormValues(equipment)
      : {
          ...emptyEquipmentFormValues,
          customerId: customer?.id ?? '',
          addressId: customer?.addresses.find((address) => address.isPrimary)?.id ?? '',
        },
    (values) => saveEquipmentAction(values, equipment?.id),
    {
      message: t(equipment ? 'fsm.equipment.form.updated' : 'fsm.equipment.form.created'),
      href: (id) => (id ? routes.view(id) : routes.list),
    },
  );

  const addressOptions = [
    { value: '', label: t('fsm.equipment.form.fields.noAddress') },
    ...(chosen?.addresses ?? []).map((address) => ({
      value: address.id,
      label: addressLabel(address),
    })),
  ];

  function textField(
    name: TextField,
    labelKey: Parameters<typeof t>[0],
    options: {
      required?: boolean;
      help?: Parameters<typeof t>[0];
      placeholder?: Parameters<typeof t>[0];
      className?: string;
      mono?: boolean;
    } = {},
  ) {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem className={options.className} required={options.required ?? false}>
            <FormLabel>{t(labelKey)}</FormLabel>
            <FormControl>
              <Input
                {...field}
                disabled={disabled}
                autoComplete="off"
                {...(options.placeholder ? { placeholder: t(options.placeholder) } : {})}
                {...(options.mono ? { className: 'tabular' } : {})}
                data-testid={`equipment-form-input-${name}`}
              />
            </FormControl>
            {options.help ? <FormDescription>{t(options.help)}</FormDescription> : null}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return (
    <RecordForm
      mode={mode}
      form={form}
      onSubmit={onSubmit}
      isPending={isPending}
      testIdPrefix="equipment-form"
      title={equipment?.name ?? t('fsm.equipment.form.newTitle')}
      {...(equipment ? {} : { description: t('fsm.equipment.form.newDescription') })}
      saveLabel={t('fsm.equipment.form.save')}
      cancelHref={equipment && mode === 'edit' ? routes.view(equipment.id) : routes.list}
      {...(equipment && canEdit ? { editHref: routes.edit(equipment.id) } : {})}
      {...(equipment ? { badges: <EquipmentStatusBadge status={equipment.status} /> } : {})}
    >
      <div className="divide-y divide-border">
        <SectionBlock>
          <FormSection
            title={t('fsm.equipment.form.sections.customer.title')}
            description={t('fsm.equipment.form.sections.customer.body')}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2" required>
                    <FormLabel>{t('fsm.equipment.form.fields.customer')}</FormLabel>
                    {disabled && equipment ? (
                      <Link
                        href={ROUTES.fsm.customers.view(equipment.customer.id)}
                        className="flex h-10 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-primary hover:underline"
                        data-testid="equipment-form-customer-link"
                      >
                        {equipment.customer.name}
                      </Link>
                    ) : (
                      <FormControl>
                        <AsyncCombobox
                          value={field.value || null}
                          selectedLabel={chosen?.name ?? null}
                          loadOptions={async (search) => {
                            const options = await searchCustomerOptionsAction(search);

                            for (const option of options) {
                              loaded.current.set(option.id, option);
                            }

                            return options.map((option) => ({
                              value: option.id,
                              label: option.name,
                              description: option.document,
                            }));
                          }}
                          onChange={(value) => {
                            const next = loaded.current.get(value);

                            if (!next) {
                              return;
                            }

                            setChosen(next);
                            field.onChange(value);
                            form.setValue(
                              'addressId',
                              next.addresses.find((address) => address.isPrimary)?.id ?? '',
                              { shouldDirty: true },
                            );
                          }}
                          placeholder={t('fsm.equipment.form.fields.customerPlaceholder')}
                          emptyText={t('fsm.equipment.form.fields.customerEmpty')}
                          data-testid="equipment-form-customer"
                        />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="addressId"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{t('fsm.equipment.form.fields.address')}</FormLabel>
                    <FormControl>
                      <Combobox
                        options={addressOptions}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={disabled || !chosen}
                        placeholder={t('fsm.equipment.form.fields.addressPlaceholder')}
                        emptyText={t('fsm.equipment.form.fields.addressEmpty')}
                        data-testid="equipment-form-address"
                      />
                    </FormControl>
                    <FormDescription>{t('fsm.equipment.form.fields.addressHelp')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {textField('location', 'fsm.equipment.form.fields.location', {
                placeholder: 'fsm.equipment.form.fields.locationPlaceholder',
                className: 'sm:col-span-2',
              })}
            </div>
          </FormSection>
        </SectionBlock>

        <SectionBlock>
          <FormSection
            title={t('fsm.equipment.form.sections.identification.title')}
            description={t('fsm.equipment.form.sections.identification.body')}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              {textField('name', 'fsm.equipment.form.fields.name', {
                required: true,
                placeholder: 'fsm.equipment.form.fields.namePlaceholder',
              })}
              {textField('tag', 'fsm.equipment.form.fields.tag', {
                help: 'fsm.equipment.form.fields.tagHelp',
                mono: true,
              })}
              {textField('category', 'fsm.equipment.form.fields.category', {
                placeholder: 'fsm.equipment.form.fields.categoryPlaceholder',
              })}
              {textField('manufacturer', 'fsm.equipment.form.fields.manufacturer')}
              {textField('model', 'fsm.equipment.form.fields.model')}
              {textField('serialNumber', 'fsm.equipment.form.fields.serialNumber', { mono: true })}
            </div>
          </FormSection>
        </SectionBlock>

        <SectionBlock>
          <FormSection
            title={t('fsm.equipment.form.sections.lifecycle.title')}
            description={t('fsm.equipment.form.sections.lifecycle.body')}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              {(['installedAt', 'warrantyUntil'] as const).map((name) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t(`fsm.equipment.form.fields.${name}`)}</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          disabled={disabled}
                          placeholder={t('common.pickDate')}
                          data-testid={`equipment-form-input-${name}`}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem required>
                    <FormLabel>{t('fsm.equipment.form.fields.status')}</FormLabel>
                    <FormControl>
                      <Combobox
                        options={EQUIPMENT_STATUSES.map((status) => ({
                          value: status,
                          label: t(`fsm.equipment.status.${status}`),
                        }))}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={disabled}
                        data-testid="equipment-form-status"
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
          <FormSection
            title={t('fsm.equipment.form.sections.notes.title')}
            description={t('fsm.equipment.form.sections.notes.body')}
            optionalLabel={t('common.optional')}
          >
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fsm.equipment.form.fields.notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      disabled={disabled}
                      data-testid="equipment-form-input-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>
        </SectionBlock>
      </div>
    </RecordForm>
  );
}
