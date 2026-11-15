'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import {
  ArrowLeft,
  Building2,
  Check,
  ClipboardList,
  Info,
  Lightbulb,
  Lock,
  MapPin,
  ShieldAlert,
  UserRound,
  Wrench,
} from 'lucide-react';
import {
  WORK_ORDER_PRIORITIES,
  emptyWorkOrderFormValues,
  formatAddress,
  formatWorkOrderNumber,
  isPlanningStatus,
  workOrderToFormValues,
  workOrderWriteSchema,
  type CustomerOptionDto,
  type WorkOrderDto,
  type WorkOrderFormValues,
} from '@oliveira/schemas';
import { reportInvalidFields } from '@/components/forms/report-invalid-fields';
import { useEntityForm } from '@/components/forms/use-entity-form';
import { Callout, FsmCard, Hint, IconTile } from '@/components/fsm/record-layout';
import { Avatar } from '@/components/fsm/person-chip';
import { CriticalityPill, Pill, WorkOrderStatusPill } from '@/components/fsm/status-pill';
import { PriorityBadge } from '@/components/fsm/work-order-badges';
import { AsyncCombobox } from '@/components/ui/async-combobox';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { DateTimeField } from '@/components/ui/date-time-field';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatDuration, formatTime } from '@/lib/fsm-format';
import { useLocale, useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import { cn } from '@/lib/utils';
import {
  customerEquipmentAction,
  saveWorkOrderAction,
  searchWorkOrderCustomersAction,
  technicianDayAction,
  type EquipmentChoice,
  type TechnicianDayJob,
} from '../_actions/work-order-actions';
import type { WorkOrderFormOptions } from '../_data-access/work-order-access';

interface WorkOrderFormProps {
  mode: 'create' | 'edit';
  workOrder?: WorkOrderDto;
  /** The chosen customer, with its addresses and contacts — the work order's, or one picked from elsewhere. */
  customer?: CustomerOptionDto | null;
  /** That customer's equipment. */
  equipment?: EquipmentChoice[];
  options: WorkOrderFormOptions;
  /** `work-order:assign` — without it, the technician is shown but can't be changed. */
  canAssign: boolean;
  /** Unfinished work orders per technician (membership id). */
  technicianLoad: Record<string, number>;
}

const routes = ROUTES.fsm.workOrders;
const STEP_KEYS = ['customer', 'service', 'schedule', 'review'] as const;
type StepKey = (typeof STEP_KEYS)[number];

const STEP_FIELDS: Record<StepKey, (keyof WorkOrderFormValues)[]> = {
  customer: ['customerId', 'serviceAddressId', 'equipmentId', 'contactId'],
  service: ['typeId', 'priority', 'title', 'description', 'externalReference'],
  schedule: ['assigneeMembershipId', 'branchId', 'scheduledAt', 'estimatedMinutes', 'dueAt'],
  review: [],
};

const DURATIONS = [30, 60, 90, 120, 180, 240, 300, 360, 480];

/** `yyyy-mm-ddThh:mm` + minutes, as calendar arithmetic (no time zone involved). */
function addToLocal(local: string, minutes: number): string {
  return new Date(Date.parse(`${local}:00.000Z`) + minutes * 60_000).toISOString().slice(0, 16);
}

/** "Mon, Nov 16 · 08:00" from a form's local date-time. */
function formatLocal(local: string, locale: string, withWeekday = true): string {
  if (!local) {
    return '—';
  }
  const date = new Date(`${local}:00.000Z`);
  const day = new Intl.DateTimeFormat(locale, {
    ...(withWeekday ? { weekday: 'short' as const } : {}),
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
  return `${day} · ${local.slice(11, 16)}`;
}

/**
 * Opening and editing a work order in four steps (boards FSM-06a–e): customer
 * and site, service, schedule, review. Continue checks only the step on
 * screen; the API checks everything on save. Editing uses the same steps,
 * every one reachable, with one Save. The type suggests a priority, a
 * duration and a due date, applied only to fields the person has not
 * changed. With a technician and a date the work order is Scheduled — the API
 * decides, the form says so.
 */
export function WorkOrderForm({
  mode,
  workOrder,
  customer,
  equipment: initialEquipment = [],
  options,
  canAssign,
  technicianLoad,
}: WorkOrderFormProps) {
  const t = useT();
  const locale = useLocale();
  const isEdit = mode === 'edit' && workOrder !== undefined;
  const [step, setStep] = useState<StepKey>('customer');
  const [reached, setReached] = useState(isEdit ? 3 : 0);
  const [chosen, setChosen] = useState<CustomerOptionDto | null>(customer ?? null);
  const [equipment, setEquipment] = useState<EquipmentChoice[]>(initialEquipment);
  const [dayJobs, setDayJobs] = useState<TechnicianDayJob[]>([]);
  const [afterCreate, setAfterCreate] = useState<'open' | 'another'>('open');
  const loaded = useRef(new Map<string, CustomerOptionDto>());
  const customerLocked = isEdit && !isPlanningStatus(workOrder.status);

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
          contactId: customer?.contacts.find((contact) => contact.isPrimary)?.id ?? '',
          branchId: customer?.defaultBranchId ?? '',
        },
    (values) => saveWorkOrderAction(values, workOrder?.id),
    {
      message: t(workOrder ? 'fsm.workOrders.form.updated' : 'fsm.workOrders.form.created'),
      href: (id) =>
        !workOrder && afterCreate === 'another' && chosen
          ? `${routes.new}?customerId=${chosen.id}`
          : id
            ? routes.view(id)
            : routes.list,
    },
  );

  const values = form.watch();
  const type = options.types.find((item) => item.id === values.typeId) ?? null;
  const chosenEquipment = equipment.find((item) => item.id === values.equipmentId) ?? null;
  const address = chosen?.addresses.find((item) => item.id === values.serviceAddressId) ?? null;
  const contact = chosen?.contacts.find((item) => item.id === values.contactId) ?? null;
  const technician =
    options.technicians.find((item) => item.membershipId === values.assigneeMembershipId) ?? null;
  const branch = options.branches.find((item) => item.id === values.branchId) ?? null;
  const willSchedule = Boolean(values.assigneeMembershipId && values.scheduledAt);
  const scheduledDay = values.scheduledAt.slice(0, 10);

  // What the chosen day already holds, per technician — refreshed when the day changes.
  useEffect(() => {
    let isCurrent = true;
    void technicianDayAction(scheduledDay, workOrder?.id).then((jobs) => {
      if (isCurrent) {
        setDayJobs(jobs);
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [scheduledDay, workOrder?.id]);

  const stepIndex = STEP_KEYS.indexOf(step);

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
    form.setValue('serviceAddressId', next.addresses.find((item) => item.isPrimary)?.id ?? '', {
      shouldDirty: true,
    });
    form.setValue('equipmentId', '', { shouldDirty: true });
    form.setValue('contactId', next.contacts.find((item) => item.isPrimary)?.id ?? '', {
      shouldDirty: true,
    });
    if (!form.getFieldState('branchId').isDirty && next.defaultBranchId) {
      form.setValue('branchId', next.defaultBranchId);
    }
    setEquipment(await customerEquipmentAction(id));
  }

  function chooseEquipment(id: string) {
    form.setValue('equipmentId', id, { shouldDirty: true });
    const addressId = equipment.find((item) => item.id === id)?.addressId;
    if (addressId) {
      form.setValue('serviceAddressId', addressId, { shouldDirty: true });
    }
  }

  /** The type's defaults, only where the person hasn't chosen yet. */
  function chooseType(id: string) {
    form.setValue('typeId', id, { shouldDirty: true, shouldValidate: form.formState.isSubmitted });
    const next = options.types.find((item) => item.id === id);
    if (!next) {
      return;
    }
    if (next.defaultPriority && !form.getFieldState('priority').isDirty) {
      form.setValue('priority', next.defaultPriority);
    }
    if (next.estimatedMinutes && !form.getFieldState('estimatedMinutes').isDirty) {
      form.setValue('estimatedMinutes', String(next.estimatedMinutes));
    }
    suggestDue(form.getValues('scheduledAt'), next.slaHours);
  }

  function suggestDue(scheduledAt: string, slaHours: number | null | undefined) {
    if (slaHours && scheduledAt && !form.getFieldState('dueAt').isDirty) {
      form.setValue('dueAt', addToLocal(scheduledAt, slaHours * 60));
    }
  }

  /** Continue: only this step's fields — plus the type's "requires equipment" rule. */
  async function validateStep(key: StepKey): Promise<boolean> {
    const fields = STEP_FIELDS[key];
    const isValid = fields.length === 0 || (await form.trigger(fields, { shouldFocus: true }));
    if (!isValid) {
      reportInvalidFields(fields.filter((field) => form.getFieldState(field).invalid).length, t);
      return false;
    }
    if (key === 'service' && type?.requiresEquipment && !form.getValues('equipmentId')) {
      form.setError(
        'typeId',
        { type: 'rule', message: t('fsmUi.workOrderForm.needsEquipment') },
        { shouldFocus: true },
      );
      reportInvalidFields(1, t);
      return false;
    }
    return true;
  }

  async function goNext() {
    if (await validateStep(step)) {
      const next = Math.min(stepIndex + 1, 3);
      setReached((current) => Math.max(current, next));
      setStep(STEP_KEYS[next]!);
    }
  }

  async function handleSave() {
    const isValid = await form.trigger();
    if (!isValid) {
      const first = STEP_KEYS.find((key) =>
        STEP_FIELDS[key].some((field) => form.getFieldState(field).invalid),
      );
      if (first) {
        setStep(first);
      }
    } else if (type?.requiresEquipment && !form.getValues('equipmentId')) {
      setStep('service');
      await validateStep('service');
      return;
    }
    await onSubmit();
  }

  const priorityLabel = t(`fsm.workOrders.priority.${values.priority}`);
  const suggestionParts = type
    ? [
        type.defaultPriority
          ? t('fsmUi.workOrderForm.suggestion.priority', {
              priority: t(`fsm.workOrders.priority.${type.defaultPriority}`),
            })
          : null,
        type.estimatedMinutes
          ? t('fsmUi.workOrderForm.suggestion.duration', {
              time: formatDuration(type.estimatedMinutes, t),
            })
          : null,
        type.slaHours ? t('fsmUi.workOrderForm.suggestion.sla', { hours: type.slaHours }) : null,
      ].filter(Boolean)
    : [];

  const typeOptions = options.types.map((item) => ({ value: item.id, label: item.name }));
  if (workOrder && !typeOptions.some((option) => option.value === workOrder.type.id)) {
    typeOptions.push({ value: workOrder.type.id, label: workOrder.type.name });
  }
  const addressOptions = [
    { value: '', label: t('fsm.workOrders.form.fields.noAddress') },
    ...(chosen?.addresses ?? []).map((item) => ({
      value: item.id,
      label: item.label ? `${item.label} — ${formatAddress(item)}` : formatAddress(item),
    })),
  ];
  const equipmentOptions = [
    { value: '', label: t('fsm.workOrders.form.fields.noEquipment') },
    ...equipment.map((item) => ({
      value: item.id,
      label: [item.tag, item.name, [item.manufacturer, item.model].filter(Boolean).join(' ')]
        .filter(Boolean)
        .join(' · '),
    })),
  ];
  const contactOptions = [
    { value: '', label: t('fsmUi.workOrderForm.noContact') },
    ...(chosen?.contacts ?? []).map((item) => ({
      value: item.id,
      label: item.role ? `${item.name} · ${item.role}` : item.name,
    })),
  ];
  const branchOptions = [
    { value: '', label: t('fsm.workOrders.form.fields.noBranch') },
    ...options.branches.map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` })),
  ];
  const durationOptions = [
    { value: '', label: t('fsmUi.workOrderForm.noDuration') },
    ...[
      ...new Set([
        ...DURATIONS,
        ...(values.estimatedMinutes ? [Number(values.estimatedMinutes)] : []),
      ]),
    ]
      .sort((a, b) => a - b)
      .map((minutes) => ({ value: String(minutes), label: formatDuration(minutes, t) })),
  ];

  const header = (
    <section className="rounded-xl border border-border bg-surface shadow-fsm-card">
      <div className="flex flex-wrap items-center gap-4 p-[22px] pb-4">
        <IconTile icon={ClipboardList} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="olv-overline text-text-3">
            {isEdit
              ? t('fsmUi.workOrderForm.editing', {
                  status: t(`fsm.workOrders.status.${workOrder.status}`).toLowerCase(),
                })
              : t('fsmUi.workOrderForm.stepOf', { step: stepIndex + 1, total: 4 })}
          </span>
          <h1
            className="!text-[22px] !leading-[28px] font-semibold tracking-[-0.015em]"
            data-testid="work-order-form-title"
          >
            {isEdit
              ? `${formatWorkOrderNumber(workOrder.number)} · ${workOrder.title}`
              : t('fsmUi.workOrderForm.newTitle')}
          </h1>
        </div>
        {isEdit ? (
          <div className="flex gap-2">
            <Button variant="ghost" asChild data-testid="work-order-form-cancel">
              <Link href={routes.view(workOrder.id)}>{t('fsmUi.workOrderForm.cancel')}</Link>
            </Button>
            <Button
              variant="confirm"
              type="button"
              disabled={isPending}
              loading={isPending}
              onClick={() => void handleSave()}
              data-testid="work-order-form-save"
            >
              <Check aria-hidden="true" />
              {t('fsmUi.workOrderForm.save')}
            </Button>
          </div>
        ) : (
          <Button variant="ghost" asChild data-testid="work-order-form-discard">
            <Link href={routes.list}>{t('fsmUi.workOrderForm.discard')}</Link>
          </Button>
        )}
      </div>
      <ol
        aria-label={t('fsmUi.workOrderForm.stepsLabel')}
        className="grid grid-cols-2 gap-2.5 px-[22px] pb-[22px] lg:grid-cols-4"
      >
        {STEP_KEYS.map((key, index) => {
          const isCurrent = key === step;
          const isDone =
            !isCurrent && index <= reached && (isEdit || index < reached || index < stepIndex);
          const isReachable = isEdit || index <= reached;
          return (
            <li key={key}>
              <button
                type="button"
                disabled={!isReachable}
                aria-current={isCurrent ? 'step' : undefined}
                onClick={() => setStep(key)}
                data-testid={`work-order-step-${key}`}
                className={cn(
                  'flex w-full min-w-0 items-center gap-3 rounded-[10px] border border-border bg-surface px-3.5 py-3 text-left transition-colors outline-none focus-visible:ring-focus',
                  isCurrent && 'border-accent-600 shadow-[0_0_0_3px_rgba(164,80,43,.12)]',
                  !isCurrent && !isDone && 'border-dashed bg-transparent',
                  isReachable && !isCurrent && 'hover:bg-surface-hover',
                  !isReachable && 'cursor-not-allowed',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full border-[1.5px] border-border-button bg-surface text-[13px] font-semibold text-text-3',
                    isDone && 'border-fsm-completed bg-fsm-completed text-white',
                    isCurrent && 'border-accent-600 bg-accent-600 text-white',
                  )}
                >
                  {isDone ? <Check className="size-4" /> : index + 1}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-[11px] font-semibold tracking-[0.06em] text-text-3 uppercase">
                    {t('fsmUi.workOrderForm.stepShort', { step: index + 1 })}
                  </span>
                  <span className="truncate text-sm font-semibold">
                    {t(`fsmUi.workOrderForm.steps.${key}.title`)}
                  </span>
                  <span className="hidden truncate text-[12.5px] text-text-3 xl:block">
                    {isEdit && !isCurrent
                      ? t('fsmUi.workOrderForm.savedOpen')
                      : t(`fsmUi.workOrderForm.steps.${key}.short`)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );

  const stepCard = (body: React.ReactNode, footer: React.ReactNode) => (
    <section className="rounded-xl border border-border bg-surface shadow-fsm-card">
      <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-1.5">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold">
            {t(`fsmUi.workOrderForm.steps.${step}.heading`)}
          </h2>
          <p className="m-0 text-[13px] text-text-3">
            {t(`fsmUi.workOrderForm.steps.${step}.body`)}
          </p>
        </div>
        {step !== 'review' ? (
          <span className="text-[12.5px] text-text-3">{t('fsmUi.workOrderForm.required')}</span>
        ) : null}
      </div>
      <div className="px-6 pt-[18px] pb-6">{body}</div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-xl border-t border-border bg-surface-2 px-6 py-4">
        {footer}
      </div>
    </section>
  );

  const footer = (nextLabel: string | null) => (
    <>
      {stepIndex > 0 ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep(STEP_KEYS[stepIndex - 1]!)}
          data-testid="work-order-form-back"
        >
          <ArrowLeft aria-hidden="true" />
          {t('fsmUi.workOrderForm.back')}
        </Button>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-2.5">
        {nextLabel ? (
          <span className="hidden text-[12.5px] text-text-3 sm:inline">{nextLabel}</span>
        ) : null}
        {isEdit && step !== 'review' ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => void goNext()}
            data-testid="work-order-form-continue"
          >
            {t('fsmUi.workOrderForm.continue')}
          </Button>
        ) : null}
        {isEdit ? (
          <Button
            type="button"
            variant="confirm"
            disabled={isPending}
            loading={isPending}
            onClick={() => void handleSave()}
            data-testid="work-order-form-save-bottom"
          >
            <Check aria-hidden="true" />
            {t('fsmUi.workOrderForm.save')}
          </Button>
        ) : step === 'review' ? (
          <Button
            type="button"
            variant="confirm"
            disabled={isPending}
            loading={isPending}
            onClick={() => void handleSave()}
            data-testid="work-order-form-submit"
          >
            <Check aria-hidden="true" />
            {t('fsmUi.workOrderForm.create')}
          </Button>
        ) : (
          <Button
            type="button"
            variant="confirm"
            onClick={() => void goNext()}
            data-testid="work-order-form-continue"
          >
            {t('fsmUi.workOrderForm.continue')}
          </Button>
        )}
      </div>
    </>
  );

  const customerStep = (
    <div className="grid grid-cols-12 gap-x-5 gap-y-[18px]">
      {customerLocked ? (
        <div className="col-span-12">
          <Hint icon={Lock}>
            {t('fsmUi.workOrderForm.customer.locked', {
              status: t(`fsm.workOrders.status.${workOrder.status}`).toLowerCase(),
            })}
          </Hint>
        </div>
      ) : null}
      <FormField
        control={form.control}
        name="customerId"
        render={({ field }) => (
          <FormItem required className="col-span-12">
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
                disabled={customerLocked}
                placeholder={t('fsm.workOrders.form.fields.customerPlaceholder')}
                emptyText={t('fsm.workOrders.form.fields.customerEmpty')}
                data-testid="work-order-form-customer"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {chosen ? (
        <div className="col-span-12 flex flex-wrap items-center gap-3 rounded-[10px] border border-divider bg-surface-2 px-3.5 py-3">
          <Avatar name={chosen.name} id={chosen.id} size="lg" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-semibold">{chosen.name}</span>
            <span className="truncate text-[12.5px] text-text-3">
              {[
                chosen.document,
                t('fsmUi.workOrderForm.customer.sites', { count: chosen.addresses.length }),
                chosen.defaultBranchId
                  ? t('fsmUi.workOrderForm.customer.defaultBranch', {
                      code:
                        options.branches.find((item) => item.id === chosen.defaultBranchId)?.code ??
                        '—',
                    })
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </div>
          <Pill tone={chosen.openWorkOrderCount > 0 ? 'warning' : 'open'}>
            {t('fsmUi.workOrderForm.customer.openCount', { count: chosen.openWorkOrderCount })}
          </Pill>
          {chosen.openWorkOrderCount > 0 ? (
            <Link
              href={`${ROUTES.fsm.customers.view(chosen.id)}?tab=work-orders`}
              target="_blank"
              className="text-[13px] font-semibold text-accent-600 hover:underline"
            >
              {t('fsmUi.workOrderForm.customer.seeThem')}
            </Link>
          ) : null}
        </div>
      ) : null}
      <FormField
        control={form.control}
        name="serviceAddressId"
        render={({ field }) => (
          <FormItem className="col-span-12">
            <FormLabel>{t('fsm.workOrders.form.fields.address')}</FormLabel>
            <FormControl>
              <Combobox
                options={addressOptions}
                value={field.value}
                onChange={field.onChange}
                disabled={!chosen || customerLocked}
                placeholder={t('fsm.workOrders.form.fields.addressPlaceholder')}
                data-testid="work-order-form-address"
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
          <FormItem
            required={type?.requiresEquipment ?? false}
            className="col-span-12 md:col-span-7"
          >
            <FormLabel>{t('fsm.workOrders.form.fields.equipment')}</FormLabel>
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
        name="contactId"
        render={({ field }) => (
          <FormItem className="col-span-12 md:col-span-5">
            <FormLabel>{t('fsmUi.workOrderForm.contact')}</FormLabel>
            <FormControl>
              <Combobox
                options={contactOptions}
                value={field.value}
                onChange={field.onChange}
                disabled={!chosen}
                data-testid="work-order-form-contact"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="col-span-12">
        <Hint icon={Info}>{t('fsmUi.workOrderForm.equipmentHint')}</Hint>
      </div>
    </div>
  );

  const serviceStep = (
    <div className="grid grid-cols-12 gap-x-5 gap-y-[18px]">
      <FormField
        control={form.control}
        name="typeId"
        render={({ field }) => (
          <FormItem required className="col-span-12 md:col-span-6">
            <FormLabel>{t('fsm.workOrders.form.fields.type')}</FormLabel>
            <FormControl>
              <Combobox
                options={typeOptions}
                value={field.value || null}
                onChange={chooseType}
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
          <FormItem required className="col-span-12 md:col-span-6">
            <FormLabel>{t('fsm.workOrders.form.fields.priority')}</FormLabel>
            <div
              role="radiogroup"
              aria-label={t('fsm.workOrders.form.fields.priority')}
              className="grid grid-cols-4 gap-0.5 rounded-[10px] bg-fsm-track p-[3px]"
              data-testid="work-order-form-priority"
            >
              {WORK_ORDER_PRIORITIES.map((priority) => (
                <button
                  key={priority}
                  type="button"
                  role="radio"
                  aria-checked={field.value === priority}
                  onClick={() => field.onChange(priority)}
                  data-testid={`work-order-form-priority-${priority.toLowerCase()}`}
                  className={cn(
                    'flex h-[34px] min-w-0 items-center justify-center rounded-[7px] outline-none hover:bg-white/50 focus-visible:shadow-[0_0_0_2px_var(--olv-accent-600)]',
                    field.value === priority &&
                      'bg-surface shadow-[0_1px_2px_rgba(16,24,40,.1),0_0_0_1px_rgba(16,24,40,.04)] hover:bg-surface',
                  )}
                >
                  <PriorityBadge priority={priority} className="truncate" />
                </button>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      {suggestionParts.length > 0 && type ? (
        <div className="col-span-12">
          <Hint icon={Lightbulb}>
            <b className="font-semibold">
              {t('fsmUi.workOrderForm.suggested', { type: type.name })}
            </b>{' '}
            {suggestionParts.join(' · ')}. {t('fsmUi.workOrderForm.suggestedApplied')}
          </Hint>
        </div>
      ) : null}
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem required className="col-span-12">
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
          <FormItem className="col-span-12">
            <FormLabel>{t('fsm.workOrders.form.fields.description')}</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                rows={4}
                className="min-h-24"
                placeholder={t('fsm.workOrders.form.fields.descriptionPlaceholder')}
                data-testid="work-order-form-input-description"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="externalReference"
        render={({ field }) => (
          <FormItem className="col-span-12 md:col-span-6">
            <FormLabel>{t('fsmUi.workOrderForm.reference')}</FormLabel>
            <FormControl>
              <Input
                {...field}
                autoComplete="off"
                placeholder={t('fsmUi.workOrderForm.referencePlaceholder')}
                data-testid="work-order-form-input-reference"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const dayLabel = scheduledDay ? formatLocal(values.scheduledAt, locale).split(' · ')[0]! : null;
  const technicianCards = [
    { membershipId: '', name: null as string | null },
    ...options.technicians.map((item) => ({
      membershipId: item.membershipId,
      name: item.name as string | null,
    })),
  ];

  const scheduleStep = (
    <div className="grid grid-cols-12 gap-x-5 gap-y-[18px]">
      <FormField
        control={form.control}
        name="assigneeMembershipId"
        render={({ field }) => (
          <FormItem className="col-span-12">
            <FormLabel>{t('fsm.workOrders.form.fields.assignee')}</FormLabel>
            <div
              role="radiogroup"
              aria-label={t('fsm.workOrders.form.fields.assignee')}
              className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4"
              data-testid="work-order-form-assignee"
            >
              {technicianCards.map((card) => {
                const jobs = dayJobs.filter((job) => job.membershipId === card.membershipId);
                const isSelected = field.value === card.membershipId;
                return (
                  <button
                    key={card.membershipId || 'none'}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={!canAssign}
                    onClick={() => field.onChange(card.membershipId)}
                    data-testid={`work-order-form-assignee-${card.membershipId || 'none'}`}
                    className={cn(
                      'flex min-w-0 items-center gap-3 rounded-[10px] border border-border bg-surface px-3.5 py-3 text-left transition-colors outline-none hover:bg-surface-hover focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-60',
                      isSelected &&
                        'border-accent-600 bg-accent-50 shadow-[inset_0_0_0_1px_var(--olv-accent-600)] hover:bg-accent-50',
                    )}
                  >
                    <Avatar name={card.name} id={card.membershipId || null} size="lg" />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-semibold">
                        {card.name ?? t('fsmUi.workOrderForm.technician.none')}
                      </span>
                      <span
                        className={cn(
                          'truncate text-[12.5px]',
                          jobs.length > 0 ? 'text-fsm-warning-fg' : 'text-text-3',
                        )}
                      >
                        {!card.membershipId
                          ? t('fsmUi.workOrderForm.technician.noneBody')
                          : dayLabel
                            ? jobs.length > 0
                              ? t('fsmUi.workOrderForm.technician.busyOn', {
                                  count: jobs.length,
                                  date: dayLabel,
                                  time: formatTime(
                                    jobs.map((job) => job.scheduledAt).sort()[0],
                                    locale,
                                  ),
                                })
                              : t('fsmUi.workOrderForm.technician.freeOn', { date: dayLabel })
                            : ''}
                      </span>
                      {card.membershipId ? (
                        <span className="truncate text-[12px] text-text-3">
                          {t('fsmUi.workOrderForm.technician.unfinished', {
                            count: technicianLoad[card.membershipId] ?? 0,
                          })}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="m-0 text-[12.5px] text-text-3">
              {t('fsmUi.workOrderForm.technician.rule')}
            </p>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="branchId"
        render={({ field }) => (
          <FormItem className="col-span-12 md:col-span-6">
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
      <FormField
        control={form.control}
        name="scheduledAt"
        render={({ field }) => (
          <FormItem className="col-span-12 md:col-span-6">
            <FormLabel>{t('fsm.workOrders.form.fields.scheduledAt')}</FormLabel>
            <FormControl>
              <DateTimeField
                value={field.value}
                onChange={(value) => {
                  field.onChange(value);
                  suggestDue(value, type?.slaHours);
                }}
                datePlaceholder={t('common.pickDate')}
                timeLabel={t('fsm.workOrders.form.fields.time')}
                data-testid="work-order-form-scheduledAt"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="estimatedMinutes"
        render={({ field }) => (
          <FormItem className="col-span-12 md:col-span-6">
            <FormLabel>{t('fsmUi.workOrderForm.duration')}</FormLabel>
            <FormControl>
              <Combobox
                options={durationOptions}
                value={field.value}
                onChange={field.onChange}
                data-testid="work-order-form-duration"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="dueAt"
        render={({ field }) => (
          <FormItem className="col-span-12 md:col-span-6">
            <FormLabel>{t('fsm.workOrders.form.fields.dueAt')}</FormLabel>
            <FormControl>
              <DateTimeField
                value={field.value}
                onChange={field.onChange}
                datePlaceholder={t('common.pickDate')}
                timeLabel={t('fsm.workOrders.form.fields.time')}
                data-testid="work-order-form-dueAt"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="col-span-12">
        <Hint icon={Info}>
          {type?.slaHours
            ? t('fsmUi.workOrderForm.dueHint', { hours: type.slaHours })
            : t('fsmUi.workOrderForm.dueHintPlain')}
        </Hint>
      </div>
    </div>
  );

  const reviewRow = (label: string, value: React.ReactNode) => (
    <div className="grid gap-1 border-b border-divider py-2.5 last:border-b-0 sm:grid-cols-[180px_minmax(0,1fr)]">
      <dt className="text-[13px] text-text-3">{label}</dt>
      <dd className="m-0 min-w-0 text-sm font-medium">{value}</dd>
    </div>
  );
  const reviewSection = (key: Exclude<StepKey, 'review'>, rows: React.ReactNode) => (
    <section className="rounded-[10px] border border-border">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-2.5">
        <span className="text-[13px] font-semibold">
          <span className="mr-2 text-text-3">
            {t('fsmUi.workOrderForm.stepOf', { step: STEP_KEYS.indexOf(key) + 1, total: 4 })}
          </span>
          {t(`fsmUi.workOrderForm.steps.${key}.title`)}
        </span>
        <button
          type="button"
          onClick={() => setStep(key)}
          className="text-[13px] font-semibold text-accent-600 hover:underline focus-visible:ring-focus"
        >
          {t('fsmUi.workOrderForm.review.change')}
        </button>
      </div>
      <dl className="m-0 px-4 py-1.5">{rows}</dl>
    </section>
  );

  const reviewStep = (
    <div className="flex flex-col gap-4">
      {reviewSection(
        'customer',
        <>
          {reviewRow(t('fsm.workOrders.form.fields.customer'), chosen?.name ?? '—')}
          {reviewRow(
            t('fsm.workOrders.form.fields.address'),
            address ? [address.label, formatAddress(address)].filter(Boolean).join(' — ') : '—',
          )}
          {reviewRow(
            t('fsm.workOrders.form.fields.equipment'),
            chosenEquipment ? (
              <>
                {chosenEquipment.name} ·{' '}
                <span className="font-mono text-[12.5px]">{chosenEquipment.tag}</span>
              </>
            ) : (
              '—'
            ),
          )}
          {reviewRow(
            t('fsmUi.workOrderForm.contact'),
            contact
              ? [contact.name, contact.mobile ?? contact.phone].filter(Boolean).join(' · ')
              : '—',
          )}
        </>,
      )}
      {reviewSection(
        'service',
        <>
          {reviewRow(t('fsm.workOrders.form.fields.type'), type?.name ?? '—')}
          {reviewRow(
            t('fsm.workOrders.form.fields.priority'),
            <PriorityBadge priority={values.priority} />,
          )}
          {reviewRow(t('fsm.workOrders.form.fields.title'), values.title || '—')}
          {reviewRow(
            t('fsm.workOrders.form.fields.description'),
            values.description ? (
              <span className="font-normal whitespace-pre-line">{values.description}</span>
            ) : (
              '—'
            ),
          )}
          {reviewRow(t('fsmUi.workOrderForm.reference'), values.externalReference || '—')}
        </>,
      )}
      {reviewSection(
        'schedule',
        <>
          {reviewRow(
            t('fsm.workOrders.form.fields.assignee'),
            technician?.name ?? t('fsmUi.common.unassigned'),
          )}
          {reviewRow(
            t('fsm.workOrders.form.fields.branch'),
            branch ? `${branch.code} · ${branch.name}` : '—',
          )}
          {reviewRow(
            t('fsm.workOrders.form.fields.scheduledAt'),
            values.scheduledAt
              ? `${formatLocal(values.scheduledAt, locale)}${values.estimatedMinutes ? ` → ${addToLocal(values.scheduledAt, Number(values.estimatedMinutes)).slice(11, 16)} (${formatDuration(Number(values.estimatedMinutes), t)})` : ''}`
              : '—',
          )}
          {reviewRow(t('fsm.workOrders.form.fields.dueAt'), formatLocal(values.dueAt, locale))}
        </>,
      )}
      {!isEdit ? (
        <div className="flex flex-col gap-3 rounded-[10px] border border-divider bg-surface-2 px-4 py-3.5">
          <span className="flex flex-wrap items-center gap-2 text-sm">
            {t('fsmUi.workOrderForm.review.checksOut')}
            <WorkOrderStatusPill status={willSchedule ? 'SCHEDULED' : 'OPEN'} />
          </span>
          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className="mb-1 text-[13px] font-medium text-text-2">
              {t('fsmUi.workOrderForm.review.afterCreating')}
            </legend>
            {(['open', 'another'] as const).map((choice) => (
              <label key={choice} className="flex items-center gap-2 text-[13.5px]">
                <input
                  type="radio"
                  name="after-create"
                  checked={afterCreate === choice}
                  onChange={() => setAfterCreate(choice)}
                  className="size-4 accent-[var(--olv-accent-600)]"
                />
                {t(
                  choice === 'open'
                    ? 'fsmUi.workOrderForm.review.openNew'
                    : 'fsmUi.workOrderForm.review.createAnother',
                )}
              </label>
            ))}
          </fieldset>
          {technician && willSchedule ? (
            <span className="text-[12.5px] text-text-3">
              {t('fsmUi.workOrderForm.review.technicianSees', { name: technician.name })}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  const summary = (
    <FsmCard
      as="aside"
      title={t('fsmUi.workOrderForm.summary.title')}
      action={
        <WorkOrderStatusPill
          status={isEdit ? workOrder.status : willSchedule ? 'SCHEDULED' : 'OPEN'}
        />
      }
      testId="work-order-form-summary"
    >
      <div className="flex flex-col gap-3.5">
        {!isEdit ? (
          <span className="text-[12.5px] text-text-3">
            {t('fsmUi.workOrderForm.summary.willOpen', {
              status: t(`fsm.workOrders.status.${willSchedule ? 'SCHEDULED' : 'OPEN'}`),
            })}
          </span>
        ) : null}
        {[
          {
            icon: Building2,
            title: chosen?.name,
            sub: address
              ? [address.label, formatAddress(address)].filter(Boolean).join(' — ')
              : null,
            show: true,
          },
          {
            icon: Wrench,
            title: chosenEquipment ? `${chosenEquipment.name}` : null,
            sub: chosenEquipment
              ? [
                  chosenEquipment.tag,
                  [chosenEquipment.manufacturer, chosenEquipment.model].filter(Boolean).join(' '),
                ]
                  .filter(Boolean)
                  .join(' · ')
              : null,
            extra: chosenEquipment?.criticality ? (
              <CriticalityPill criticality={chosenEquipment.criticality} />
            ) : null,
            show: true,
          },
          {
            icon: UserRound,
            title: contact?.name,
            sub: contact
              ? t('fsmUi.workOrderForm.summary.contactRole', {
                  phone: contact.mobile ?? contact.phone ?? '—',
                })
              : null,
            show: true,
          },
          {
            icon: ClipboardList,
            title: values.title || null,
            sub: type ? `${type.name} · ${priorityLabel}` : null,
            label: t('fsmUi.workOrderForm.steps.service.title'),
            show: true,
          },
          {
            icon: MapPin,
            title:
              technician || values.scheduledAt
                ? [
                    technician?.name,
                    values.scheduledAt ? formatLocal(values.scheduledAt, locale) : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : null,
            sub:
              [
                branch?.code,
                values.estimatedMinutes ? formatDuration(Number(values.estimatedMinutes), t) : null,
                values.dueAt
                  ? `${t('fsm.workOrders.form.fields.dueAt').toLowerCase()} ${formatLocal(values.dueAt, locale, false)}`
                  : null,
              ]
                .filter(Boolean)
                .join(' · ') || null,
            label: t('fsmUi.workOrderForm.steps.schedule.title'),
            show: true,
          },
        ].map((row, index) => (
          <div key={index} className={cn('flex gap-3', !row.title && 'opacity-55')}>
            <IconTile icon={row.icon} tone="slate" />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-sm font-semibold">
                {row.title ?? row.label ?? '—'}
              </span>
              {row.sub ? <span className="text-[12.5px] text-text-3">{row.sub}</span> : null}
              {row.extra ? <span className="mt-1">{row.extra}</span> : null}
            </div>
          </div>
        ))}
        {chosen?.serviceInstructions ? (
          <Callout icon={ShieldAlert} title={t('fsmUi.workOrder.job.instructions')}>
            {chosen.serviceInstructions}
          </Callout>
        ) : null}
        {isEdit ? (
          <Hint icon={Info}>
            <b className="font-semibold">{t('fsmUi.workOrderForm.editRules.title')}</b>{' '}
            {t('fsmUi.workOrderForm.editRules.body')} {t('fsmUi.workOrderForm.editRules.assign')}
          </Hint>
        ) : null}
      </div>
    </FsmCard>
  );

  const nextHints: Record<StepKey, string | null> = {
    customer: t('fsmUi.workOrderForm.next.service'),
    service: t('fsmUi.workOrderForm.next.schedule'),
    schedule: t('fsmUi.workOrderForm.next.review'),
    review: null,
  };

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (isEdit || step === 'review') {
            void handleSave();
          } else {
            void goNext();
          }
        }}
        className="flex flex-col gap-5"
        data-testid="work-order-form"
      >
        {header}
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          {stepCard(
            step === 'customer'
              ? customerStep
              : step === 'service'
                ? serviceStep
                : step === 'schedule'
                  ? scheduleStep
                  : reviewStep,
            footer(nextHints[step]),
          )}
          {summary}
        </div>
      </form>
    </Form>
  );
}
