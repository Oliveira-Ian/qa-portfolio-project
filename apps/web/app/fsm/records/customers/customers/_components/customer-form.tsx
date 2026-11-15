'use client';

import { useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import { Check, ClipboardList, Contact, IdCard, MapPin, ShieldAlert, Wrench } from 'lucide-react';
import {
  customerFormSchema,
  customerToFormValues,
  emptyCustomerFormValues,
  type CustomerDto,
  type CustomerFormValues,
} from '@oliveira/schemas';
import { useEntityForm } from '@/components/forms/use-entity-form';
import { IconTile, NewBadge, OptionalBadge } from '@/components/fsm/record-layout';
import { initialsOf } from '@/components/fsm/person-chip';
import { Pill } from '@/components/fsm/status-pill';
import { PersonFormFields } from '@/components/people/person-form-fields';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import { cn } from '@/lib/utils';
import { saveCustomerAction } from '../_actions/customer-actions';

type EditTab = 'details' | 'sites' | 'contacts';

const TAB_FIELDS: Record<EditTab, (keyof CustomerFormValues)[]> = {
  details: [
    'name',
    'tradeName',
    'documentType',
    'document',
    'stateRegistration',
    'municipalRegistration',
    'email',
    'phone',
    'mobile',
    'active',
    'notes',
    'serviceInstructions',
    'defaultBranchId',
  ],
  sites: ['addresses'],
  contacts: ['contacts'],
};

interface CustomerFormProps {
  mode: 'create' | 'edit';
  customer?: CustomerDto;
  branches: { id: string; code: string; name: string }[];
}

const routes = ROUTES.fsm.customers;

/**
 * Creating and editing a customer (boards FSM-08a–c): the same three tabs —
 * Details, Sites, Contacts — all mounted at once so one Save checks and keeps
 * every tab; a tab with errors shows a red count and the save opens it. While
 * editing, Equipment and Work orders show greyed: they are the record's, not
 * edited here. The fields are the person record's (`PersonFormFields`, the
 * ERP's own) without the ERP's types, plus what the FSM keeps on the customer.
 */
export function CustomerForm({ customer, branches }: CustomerFormProps) {
  const t = useT();
  const [tab, setTab] = useState<EditTab>('details');
  const { form, isPending, onSubmit } = useEntityForm<CustomerFormValues>(
    zodResolver(customerFormSchema) as Resolver<CustomerFormValues, unknown, CustomerFormValues>,
    customer ? customerToFormValues(customer) : emptyCustomerFormValues,
    (values) => saveCustomerAction(values, customer?.id),
    {
      message: t(customer ? 'fsm.customers.form.updated' : 'fsm.customers.form.created'),
      href: (id) => (id ? routes.view(id) : routes.list),
    },
  );
  const { errors, isDirty } = form.formState;
  const values = form.watch();
  const errorCount = (key: EditTab) =>
    TAB_FIELDS[key].filter((field) => errors[field] !== undefined).length;
  const totalErrors = errorCount('details') + errorCount('sites') + errorCount('contacts');

  async function handleSave() {
    if (!(await form.trigger())) {
      const first = (['details', 'sites', 'contacts'] as const).find((key) => errorCount(key) > 0);
      if (first) {
        setTab(first);
      }
    }
    await onSubmit();
  }

  const tabs: {
    key: EditTab | 'equipment' | 'work-orders';
    label: string;
    icon: typeof IdCard;
    count?: number;
    disabled?: boolean;
  }[] = [
    { key: 'details', label: t('fsmUi.customer.tabs.details'), icon: IdCard },
    {
      key: 'sites',
      label: t('fsmUi.customer.tabs.sites'),
      icon: MapPin,
      count: values.addresses.length,
    },
    {
      key: 'contacts',
      label: t('fsmUi.customer.tabs.contacts'),
      icon: Contact,
      count: values.contacts.length,
    },
    ...(customer
      ? [
          {
            key: 'equipment' as const,
            label: t('fsmUi.customer.tabs.equipment'),
            icon: Wrench,
            count: customer.equipmentCount,
            disabled: true,
          },
          {
            key: 'work-orders' as const,
            label: t('fsmUi.customer.tabs.workOrders'),
            icon: ClipboardList,
            count: customer.workOrderCount,
            disabled: true,
          },
        ]
      : []),
  ];

  const branchOptions = [
    { value: '', label: t('fsmUi.customer.details.noBranch') },
    ...branches.map((branch) => ({ value: branch.id, label: `${branch.code} · ${branch.name}` })),
  ];

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void handleSave();
        }}
        className="flex flex-col gap-5 pb-24"
        data-testid="customer-form"
      >
        <section className="rounded-xl border border-border bg-surface shadow-fsm-card">
          <div className="flex flex-wrap items-center gap-4 px-[22px] py-[18px]">
            <IconTile
              size="lg"
              className="bg-fsm-avatar-1 text-base font-bold text-fsm-avatar-1-fg"
            >
              {values.name ? (
                initialsOf(values.tradeName || values.name)
              ) : (
                <IdCard className="size-[22px]" />
              )}
            </IconTile>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="olv-overline text-text-3">
                {t(customer ? 'fsmUi.customer.editingOverline' : 'fsmUi.customer.newOverline')}
              </span>
              <h1
                className="!text-[20px] !leading-[26px] font-semibold tracking-[-0.015em]"
                data-testid="customer-form-title"
              >
                {values.name || customer?.person.name || t('fsmUi.customer.newTitle')}
              </h1>
            </div>
            {isDirty ? <Pill tone="warning">{t('fsmUi.record.unsaved')}</Pill> : null}
          </div>
          <nav aria-label={t('fsmUi.record.tabsLabel')} className="border-t border-border px-2.5">
            <ul role="tablist" className="flex gap-0.5 overflow-x-auto lg:overflow-visible">
              {tabs.map((item) => {
                const isCurrent = item.key === tab;
                const errorsHere =
                  item.key === 'details' || item.key === 'sites' || item.key === 'contacts'
                    ? errorCount(item.key)
                    : 0;
                const Icon = item.icon;
                return (
                  <li key={item.key} className="flex lg:flex-1">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={isCurrent}
                      aria-disabled={item.disabled || undefined}
                      title={item.disabled ? t('fsmUi.record.readOnlyWhileEditing') : undefined}
                      onClick={() => !item.disabled && setTab(item.key as EditTab)}
                      data-testid={`customer-form-tab-${item.key}`}
                      className={cn(
                        'relative flex h-[46px] w-full items-center justify-center gap-2 rounded-t-lg px-3.5 text-sm font-medium whitespace-nowrap text-text-3 outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--olv-accent-600)] lg:flex-1',
                        isCurrent
                          ? 'font-semibold text-foreground after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-t-sm after:bg-accent-600'
                          : 'hover:bg-surface-hover hover:text-foreground',
                        item.disabled &&
                          'cursor-not-allowed text-text-disabled hover:bg-transparent hover:text-text-disabled',
                      )}
                    >
                      <Icon
                        aria-hidden="true"
                        className={cn('size-4 text-text-muted', isCurrent && 'text-accent-600')}
                      />
                      {item.label}
                      {errorsHere > 0 ? (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FEE4E2] px-1.5 text-[11.5px] font-semibold text-[#B42318] tabular-nums">
                          {errorsHere}
                        </span>
                      ) : item.count !== undefined ? (
                        <span
                          className={cn(
                            'inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-divider px-1.5 text-[11.5px] font-semibold text-text-3 tabular-nums',
                            isCurrent && 'bg-accent-50 text-accent-700',
                          )}
                        >
                          {item.count}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </section>

        {/* Every tab stays mounted (hidden), so validation and Save cover all of them. */}
        <div hidden={tab !== 'details'} className="flex max-w-[1128px] flex-col gap-4">
          <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-fsm-card">
            <PersonFormFields variant="customer" sections={['identification', 'contact']} />
          </div>
          <section className="rounded-xl border border-border bg-surface shadow-fsm-card">
            <div className="flex items-start gap-3 px-[22px] pt-[18px] pb-1">
              <IconTile icon={ShieldAlert} />
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-2">
                  <h2 className="text-base font-semibold">{t('fsmUi.customer.details.service')}</h2>
                  <OptionalBadge label={t('fsmUi.common.optional')} />
                  <NewBadge label={t('fsmUi.common.new')} />
                </span>
                <p className="m-0 text-[13px] text-text-3">
                  {t('fsmUi.customer.details.serviceBody')}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-x-5 gap-y-[18px] px-[22px] pt-4 pb-[22px]">
              <FormField
                control={form.control}
                name="serviceInstructions"
                render={({ field }) => (
                  <FormItem className="col-span-12 md:col-span-8">
                    <FormLabel>{t('fsmUi.customer.details.instructions')}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        maxLength={1000}
                        placeholder={t('fsmUi.customer.details.instructionsPlaceholder')}
                        data-testid="customer-form-input-instructions"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defaultBranchId"
                render={({ field }) => (
                  <FormItem className="col-span-12 md:col-span-4">
                    <FormLabel>{t('fsmUi.customer.details.defaultBranch')}</FormLabel>
                    <FormControl>
                      <Combobox
                        options={branchOptions}
                        value={field.value}
                        onChange={field.onChange}
                        data-testid="customer-form-branch"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>
          <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-fsm-card">
            <PersonFormFields variant="customer" sections={['notes']} />
          </div>
        </div>
        <div
          hidden={tab !== 'sites'}
          className="max-w-[1128px] overflow-hidden rounded-xl border border-border bg-surface shadow-fsm-card"
        >
          <PersonFormFields variant="customer" sections={['addresses']} />
        </div>
        <div
          hidden={tab !== 'contacts'}
          className="max-w-[1128px] overflow-hidden rounded-xl border border-border bg-surface shadow-fsm-card"
        >
          <PersonFormFields variant="customer" sections={['contacts']} />
        </div>

        <div className="sticky bottom-4 z-10 flex max-w-[1128px] flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-[22px] py-3.5 shadow-fsm-floating">
          <span
            className={cn(
              'text-[12.5px]',
              totalErrors > 0 ? 'font-medium text-fsm-overdue' : 'text-text-3',
            )}
          >
            {totalErrors > 0
              ? t('fsmUi.record.needsAttention', { count: totalErrors })
              : isDirty
                ? t('fsmUi.record.unsaved')
                : t('fsmUi.record.saveHint')}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" asChild data-testid="customer-form-button-cancel">
              <Link href={customer ? routes.view(customer.id) : routes.list}>
                {t('fsmUi.record.cancel')}
              </Link>
            </Button>
            <Button
              type="submit"
              variant="confirm"
              disabled={isPending}
              loading={isPending}
              data-testid="customer-form-button-save"
            >
              <Check aria-hidden="true" />
              {customer ? t('fsmUi.record.save') : t('fsmUi.record.create')}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
