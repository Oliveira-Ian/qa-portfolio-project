'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  ClipboardList,
  Contact,
  ExternalLink,
  IdCard,
  LayoutGrid,
  MapPin,
  NotebookPen,
  Pencil,
  Plus,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import {
  WORK_ORDER_STATUSES,
  formatAddress,
  formatWorkOrderNumber,
  type CustomerDto,
  type EquipmentDto,
  type WorkOrderListItemDto,
  type WorkOrderStatus,
} from '@oliveira/schemas';
import {
  Callout,
  FsmCard,
  IconTile,
  KeyValues,
  OptionalBadge,
  ReadOnlyField,
  RecordFacts,
  RecordHeader,
  RecordTabs,
  SectionCard,
} from '@/components/fsm/record-layout';
import { Avatar, PersonChip, initialsOf } from '@/components/fsm/person-chip';
import {
  ActivePill,
  CriticalityPill,
  EquipmentStatusPill,
  Pill,
  WORK_ORDER_STATUS_COLOR,
  WorkOrderStatusPill,
} from '@/components/fsm/status-pill';
import { PriorityBadge } from '@/components/fsm/work-order-badges';
import { Button } from '@/components/ui/button';
import { dueSignal, formatShortDate } from '@/lib/fsm-format';
import { useLocale, useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import { cn } from '@/lib/utils';

export type CustomerTab =
  'overview' | 'details' | 'sites' | 'contacts' | 'equipment' | 'work-orders';

interface CustomerRecordProps {
  customer: CustomerDto;
  /** The customer's equipment — empty without `equipment:view`. */
  equipment: EquipmentDto[];
  /** The customer's work orders, newest first — `null` without `work-order:view`. */
  workOrders: WorkOrderListItemDto[] | null;
  tab: CustomerTab;
  now: string;
  can: { edit: boolean; createWorkOrder: boolean; addEquipment: boolean; viewEquipment: boolean };
}

const isOpen = (status: WorkOrderStatus) => status !== 'COMPLETED' && status !== 'CANCELLED';

/**
 * A customer of the FSM (boards FSM-07a–f): a header with its facts and six
 * equal-width tabs kept in the URL — Overview, Details, Sites, Contacts,
 * Equipment, Work orders. Everything is read-only here; Edit opens the
 * three editable tabs.
 */
export function CustomerRecord({
  customer,
  equipment,
  workOrders,
  tab,
  now,
  can,
}: CustomerRecordProps) {
  const t = useT();
  const locale = useLocale();
  const { person } = customer;
  const base = ROUTES.fsm.customers.view(customer.id);
  const orders = workOrders ?? [];
  const completed = orders
    .filter((order) => order.status === 'COMPLETED' && order.completedAt)
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
  const first = [...orders].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
  const primary = person.addresses.find((address) => address.isPrimary) ?? person.addresses[0];
  const inactiveEquipment = equipment.filter((item) => item.status !== 'ACTIVE').length;
  const newWorkOrderHref = `${ROUTES.fsm.workOrders.new}?customerId=${encodeURIComponent(customer.id)}`;

  const tabs = [
    { key: 'overview', label: t('fsmUi.customer.tabs.overview'), icon: LayoutGrid },
    { key: 'details', label: t('fsmUi.customer.tabs.details'), icon: IdCard },
    {
      key: 'sites',
      label: t('fsmUi.customer.tabs.sites'),
      icon: MapPin,
      count: person.addresses.length,
    },
    {
      key: 'contacts',
      label: t('fsmUi.customer.tabs.contacts'),
      icon: Contact,
      count: person.contacts.length,
    },
    ...(can.viewEquipment
      ? [
          {
            key: 'equipment',
            label: t('fsmUi.customer.tabs.equipment'),
            icon: Wrench,
            count: customer.equipmentCount,
          },
        ]
      : []),
    ...(workOrders
      ? [
          {
            key: 'work-orders',
            label: t('fsmUi.customer.tabs.workOrders'),
            icon: ClipboardList,
            count: customer.workOrderCount,
          },
        ]
      : []),
  ].map((item) => ({
    ...item,
    href: item.key === 'overview' ? base : `${base}?tab=${item.key}`,
    testId: `customer-tab-${item.key}`,
  }));

  return (
    <div className="flex flex-col gap-5" data-testid="customer-record">
      <RecordHeader
        testId="customer-header"
        tile={
          <IconTile size="lg" className="bg-fsm-avatar-1 text-base font-bold text-fsm-avatar-1-fg">
            {initialsOf(person.tradeName ?? person.name)}
          </IconTile>
        }
        overline={
          <>
            {t('fsmUi.customer.overline')}
            {person.document ? (
              <>
                {' · '}
                <span className="font-mono tracking-normal">
                  {person.documentType} {person.document}
                </span>
              </>
            ) : null}
          </>
        }
        title={person.name}
        titleTestId="customer-record-title"
        chips={
          <>
            <ActivePill isActive={person.active} />
            {person.tradeName ? (
              <span className="text-[13px] text-text-3">
                {t('fsmUi.customer.tradeName', { name: person.tradeName })}
              </span>
            ) : null}
            {customer.defaultBranch ? (
              <>
                <span aria-hidden="true" className="h-4 w-px bg-border" />
                <span className="text-[13px] text-text-3">
                  {t('fsmUi.customer.defaultBranch', { code: customer.defaultBranch.code })}
                </span>
              </>
            ) : null}
          </>
        }
        actions={
          <>
            {can.edit ? (
              <Button variant="edit" asChild data-testid="customer-form-button-edit">
                <Link href={ROUTES.fsm.customers.edit(customer.id)}>
                  <Pencil aria-hidden="true" />
                  {t('fsmUi.record.edit')}
                </Link>
              </Button>
            ) : null}
            {can.createWorkOrder && person.active ? (
              <Button variant="create" asChild data-testid="customer-new-work-order">
                <Link href={newWorkOrderHref}>
                  <Plus aria-hidden="true" />
                  {t('fsmUi.customer.newWorkOrder')}
                </Link>
              </Button>
            ) : null}
          </>
        }
        strip={
          <RecordFacts
            facts={[
              {
                label: t('fsmUi.customer.facts.open'),
                value: customer.openWorkOrderCount,
                hint:
                  customer.overdueWorkOrderCount > 0 ? (
                    <span className="text-fsm-overdue">
                      {t('fsmUi.customer.facts.overdue', { count: customer.overdueWorkOrderCount })}
                    </span>
                  ) : (
                    t('fsmUi.customer.facts.noneOverdue')
                  ),
              },
              {
                label: t('fsmUi.customer.facts.equipment'),
                value: customer.equipmentCount,
                hint:
                  inactiveEquipment > 0
                    ? t('fsmUi.customer.facts.someInactive', { count: inactiveEquipment })
                    : t('fsmUi.customer.facts.allActive'),
              },
              {
                label: t('fsmUi.customer.facts.sites'),
                value: person.addresses.length,
                hint: primary?.city ?? '—',
              },
              {
                label: t('fsmUi.customer.facts.lastCompleted'),
                value: completed[0] ? formatShortDate(completed[0].completedAt, locale) : '—',
                hint: completed[0]
                  ? [formatWorkOrderNumber(completed[0].number), completed[0].equipment?.name]
                      .filter(Boolean)
                      .join(' · ')
                  : t('fsmUi.customer.facts.never'),
              },
              {
                label: t('fsmUi.customer.facts.firstWorkOrder'),
                value: first ? formatShortDate(first.createdAt, locale) : '—',
                hint: first ? formatWorkOrderNumber(first.number) : t('fsmUi.customer.facts.never'),
              },
            ]}
          />
        }
        tabs={<RecordTabs label={t('fsmUi.record.tabsLabel')} current={tab} tabs={tabs} />}
      />

      {tab === 'details' ? (
        <CustomerDetails customer={customer} />
      ) : tab === 'sites' ? (
        <CustomerSites customer={customer} equipment={equipment} workOrders={orders} />
      ) : tab === 'contacts' ? (
        <CustomerContacts customer={customer} />
      ) : tab === 'equipment' ? (
        <CustomerEquipmentTab
          customer={customer}
          equipment={equipment}
          now={now}
          canAdd={can.addEquipment}
        />
      ) : tab === 'work-orders' ? (
        <CustomerWorkOrders
          workOrders={orders}
          now={now}
          newHref={can.createWorkOrder ? newWorkOrderHref : null}
        />
      ) : (
        <CustomerOverview
          customer={customer}
          equipment={equipment}
          workOrders={orders}
          now={now}
          base={base}
          newHref={can.createWorkOrder ? newWorkOrderHref : null}
        />
      )}
    </div>
  );
}

function CustomerOverview({
  customer,
  equipment,
  workOrders,
  now,
  base,
  newHref,
}: {
  customer: CustomerDto;
  equipment: EquipmentDto[];
  workOrders: WorkOrderListItemDto[];
  now: string;
  base: string;
  newHref: string | null;
}) {
  const t = useT();
  const locale = useLocale();
  const open = workOrders
    .filter((order) => isOpen(order.status))
    .sort((a, b) => (a.dueAt ?? '9999').localeCompare(b.dueAt ?? '9999'));
  const sites = new Set(equipment.map((item) => item.address?.id).filter(Boolean)).size;
  const contact =
    customer.person.contacts.find((item) => item.isPrimary) ?? customer.person.contacts[0];

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-5">
        <FsmCard
          title={t('fsmUi.customer.overview.openTitle')}
          description={t('fsmUi.customer.overview.openBody', { count: open.length })}
          action={
            newHref ? (
              <Button variant="create" size="sm" asChild>
                <Link href={newHref}>
                  <Plus aria-hidden="true" />
                  {t('fsmUi.common.new')}
                </Link>
              </Button>
            ) : null
          }
          padded={false}
        >
          {open.length === 0 ? (
            <p className="m-0 px-5 pb-5 text-[13.5px] text-text-3">
              {t('fsmUi.customer.overview.noOpen')}
            </p>
          ) : (
            <ul className="m-0 list-none divide-y divide-divider border-t border-divider p-0">
              {open.map((order) => {
                const due = dueSignal(order.dueAt, now, false, t, locale);
                return (
                  <li key={order.id}>
                    <Link
                      href={ROUTES.fsm.workOrders.view(order.id)}
                      className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 px-5 py-3 hover:bg-surface-hover focus-visible:ring-focus"
                    >
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate font-semibold">
                          <span className="mr-1.5 font-mono text-[12.5px] font-medium text-text-3">
                            {formatWorkOrderNumber(order.number)}
                          </span>
                          {order.title}
                        </span>
                        <span className="truncate text-[12.5px] text-text-3">
                          {[
                            order.type.name,
                            order.equipment?.name,
                            order.assignee?.name ?? t('fsmUi.customer.overview.noTechnician'),
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </span>
                      <WorkOrderStatusPill status={order.status} />
                      <span
                        className={cn(
                          'w-28 text-right text-[12.5px]',
                          due?.tone === 'critical'
                            ? 'font-semibold text-fsm-overdue'
                            : 'text-text-3',
                        )}
                      >
                        {due?.text ?? '—'}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </FsmCard>

        <FsmCard
          title={t('fsmUi.customer.overview.equipmentTitle')}
          description={t('fsmUi.customer.overview.equipmentBody', {
            count: equipment.length,
            sites,
          })}
          action={
            <Link
              href={`${base}?tab=equipment`}
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent-600 hover:underline"
            >
              {t('fsmUi.customer.overview.allEquipment')}
              <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          }
          padded={false}
        >
          {equipment.length === 0 ? (
            <p className="m-0 px-5 pb-5 text-[13.5px] text-text-3">
              {t('fsmUi.customer.overview.noEquipment')}
            </p>
          ) : (
            <ul className="m-0 list-none divide-y divide-divider border-t border-divider p-0">
              {equipment.map((item) => (
                <li key={item.id}>
                  <Link
                    href={ROUTES.fsm.equipment.view(item.id)}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3 hover:bg-surface-hover focus-visible:ring-focus"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <IconTile icon={Wrench} tone="slate" />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate font-semibold">{item.name}</span>
                        <span className="truncate text-[12.5px] text-text-3">
                          {[item.tag, [item.manufacturer, item.model].filter(Boolean).join(' ')]
                            .filter(Boolean)
                            .join(' · ')}
                          {' · '}
                          {item.address?.label ?? item.address?.city ?? '—'}
                          {' · '}
                          {item.lastService
                            ? t('fsmUi.customer.overview.lastOn', {
                                date: formatShortDate(item.lastService.completedAt, locale),
                              })
                            : t('fsmUi.customer.overview.noServiceYet')}
                        </span>
                      </span>
                    </span>
                    <EquipmentStatusPill status={item.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </FsmCard>
      </div>

      <aside className="flex min-w-0 flex-col gap-5">
        <FsmCard
          title={t('fsmUi.customer.overview.instructionsTitle')}
          description={t('fsmUi.customer.overview.instructionsBody')}
        >
          {customer.serviceInstructions ? (
            <Callout icon={ShieldAlert} title={t('fsmUi.workOrder.job.instructions')}>
              {customer.serviceInstructions}
            </Callout>
          ) : (
            <p className="m-0 text-[13.5px] text-text-3">
              {t('fsmUi.customer.overview.noInstructions')}
            </p>
          )}
        </FsmCard>
        <FsmCard title={t('fsmUi.customer.overview.primaryContact')}>
          {contact ? (
            <PersonChip
              name={contact.name}
              id={contact.id}
              unassignedLabel="—"
              size="lg"
              subline={[contact.role, contact.mobile ?? contact.phone].filter(Boolean).join(' · ')}
            />
          ) : (
            <p className="m-0 text-[13.5px] text-text-3">
              {t('fsmUi.customer.overview.noContact')}
            </p>
          )}
        </FsmCard>
      </aside>
    </div>
  );
}

function CustomerDetails({ customer }: { customer: CustomerDto }) {
  const t = useT();
  const { person } = customer;

  return (
    <div className="flex max-w-[1128px] flex-col gap-4">
      <SectionCard
        icon={IdCard}
        title={t('fsmUi.customer.details.identification')}
        description={t('fsmUi.customer.details.identificationBody')}
      >
        <ReadOnlyField
          label={t('fsmUi.customer.details.name')}
          value={person.name}
          span="col-span-12 md:col-span-8"
        />
        <ReadOnlyField
          label={t('fsmUi.customer.details.tradeName')}
          value={person.tradeName}
          span="col-span-12 md:col-span-4"
        />
        <ReadOnlyField
          label={t('fsmUi.customer.details.documentType')}
          value={person.documentType}
          span="col-span-6 md:col-span-3"
        />
        <ReadOnlyField
          label={t('fsmUi.customer.details.document')}
          value={person.document}
          mono
          span="col-span-6 md:col-span-3"
        />
        {person.documentType === 'CNPJ' ? (
          <>
            <ReadOnlyField
              label={t('fsmUi.customer.details.stateRegistration')}
              value={person.stateRegistration}
              span="col-span-6 md:col-span-3"
            />
            <ReadOnlyField
              label={t('fsmUi.customer.details.municipalRegistration')}
              value={person.municipalRegistration}
              span="col-span-6 md:col-span-3"
            />
          </>
        ) : null}
        <ReadOnlyField
          label={t('fsmUi.customer.details.status')}
          value={<ActivePill isActive={person.active} />}
          span="col-span-6 md:col-span-3"
        />
      </SectionCard>

      <SectionCard
        icon={Contact}
        title={t('fsmUi.customer.details.contact')}
        description={t('fsmUi.customer.details.contactBody')}
        badge={<OptionalBadge label={t('fsmUi.common.optional')} />}
      >
        <ReadOnlyField
          label={t('fsmUi.customer.details.email')}
          value={person.email}
          span="col-span-12 md:col-span-6"
        />
        <ReadOnlyField
          label={t('fsmUi.customer.details.phone')}
          value={person.phone}
          span="col-span-6 md:col-span-3"
        />
        <ReadOnlyField
          label={t('fsmUi.customer.details.mobile')}
          value={person.mobile}
          span="col-span-6 md:col-span-3"
        />
      </SectionCard>

      <SectionCard
        icon={ShieldAlert}
        title={t('fsmUi.customer.details.service')}
        description={t('fsmUi.customer.details.serviceBody')}
        badge={<OptionalBadge label={t('fsmUi.common.optional')} />}
      >
        <ReadOnlyField
          label={t('fsmUi.customer.details.instructions')}
          value={customer.serviceInstructions}
          multiline
          span="col-span-12 md:col-span-8"
        />
        <ReadOnlyField
          label={t('fsmUi.customer.details.defaultBranch')}
          value={
            customer.defaultBranch
              ? `${customer.defaultBranch.code} · ${customer.defaultBranch.name}`
              : null
          }
          span="col-span-12 md:col-span-4"
        />
      </SectionCard>

      <SectionCard
        icon={NotebookPen}
        title={t('fsmUi.customer.details.notes')}
        description={t('fsmUi.customer.details.notesBody')}
        badge={<OptionalBadge label={t('fsmUi.common.optional')} />}
      >
        <ReadOnlyField
          label={t('fsmUi.customer.details.notes')}
          value={person.notes}
          multiline
          span="col-span-12"
        />
      </SectionCard>
    </div>
  );
}

function CustomerSites({
  customer,
  equipment,
  workOrders,
}: {
  customer: CustomerDto;
  equipment: EquipmentDto[];
  workOrders: WorkOrderListItemDto[];
}) {
  const t = useT();
  const addresses = customer.person.addresses;

  if (addresses.length === 0) {
    return (
      <FsmCard>
        <p className="m-0 text-[13.5px] text-text-3">{t('fsmUi.customer.sites.empty')}</p>
      </FsmCard>
    );
  }

  return (
    <div className="flex max-w-[1128px] flex-col gap-4">
      <div className="grid gap-4 xl:grid-cols-2">
        {addresses.map((address) => {
          const here = equipment.filter((item) => item.address?.id === address.id);
          const query = encodeURIComponent(formatAddress(address));
          return (
            <FsmCard
              key={address.id}
              testId={`customer-site-${address.id}`}
              title={
                <span className="flex items-center gap-2">
                  {address.label ?? t(`common.address.types.${address.type}`)}
                  {address.isPrimary ? (
                    <Pill tone="completed">{t('fsmUi.customer.sites.primary')}</Pill>
                  ) : null}
                </span>
              }
              description={t(`common.address.types.${address.type}`)}
              action={
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${query}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent-600 hover:underline"
                >
                  {t('fsmUi.common.openInMaps')}
                  <ExternalLink aria-hidden="true" className="size-3.5" />
                </a>
              }
            >
              <KeyValues
                labelWidth={150}
                items={[
                  {
                    label: t('fsmUi.customer.sites.address'),
                    value:
                      [address.street, address.number].filter(Boolean).join(', ') +
                        (address.district ? ` · ${address.district}` : '') || '—',
                  },
                  {
                    label: t('fsmUi.customer.sites.zipCode'),
                    value: address.zipCode ? (
                      <span className="font-mono text-[13px]">{address.zipCode}</span>
                    ) : (
                      '—'
                    ),
                  },
                  {
                    label: t('fsmUi.customer.sites.cityState'),
                    value: [address.city, address.state].filter(Boolean).join('/') || '—',
                  },
                  { label: t('fsmUi.customer.sites.complement'), value: address.complement ?? '—' },
                  { label: t('fsmUi.customer.sites.reference'), value: address.reference ?? '—' },
                  { label: t('fsmUi.customer.sites.receives'), value: address.serviceHours ?? '—' },
                  {
                    label: t('fsmUi.customer.sites.equipmentHere'),
                    value: here.length ? (
                      <span className="flex flex-wrap gap-x-2 gap-y-1">
                        {here.map((item) => (
                          <Link
                            key={item.id}
                            href={ROUTES.fsm.equipment.view(item.id)}
                            className="font-mono text-[12.5px] text-accent-600 hover:underline"
                          >
                            {item.tag ?? item.name}
                          </Link>
                        ))}
                      </span>
                    ) : (
                      '—'
                    ),
                  },
                  {
                    label: t('fsmUi.customer.sites.openHere'),
                    value: (() => {
                      const open = workOrders.filter(
                        (order) =>
                          isOpen(order.status) &&
                          here.some((item) => item.id === order.equipment?.id),
                      );
                      return open.length ? (
                        <span className="flex flex-wrap gap-x-2 gap-y-1">
                          {open.map((order) => (
                            <Link
                              key={order.id}
                              href={ROUTES.fsm.workOrders.view(order.id)}
                              className="font-mono text-[12.5px] text-accent-600 hover:underline"
                            >
                              {formatWorkOrderNumber(order.number)}
                            </Link>
                          ))}
                        </span>
                      ) : (
                        '—'
                      );
                    })(),
                  },
                ]}
              />
            </FsmCard>
          );
        })}
      </div>
      <p className="m-0 text-[12.5px] text-text-3">{t('fsmUi.customer.sites.rule')}</p>
    </div>
  );
}

function CustomerContacts({ customer }: { customer: CustomerDto }) {
  const t = useT();
  const contacts = customer.person.contacts;

  return (
    <div className="flex max-w-[1128px] flex-col gap-4">
      {contacts.length === 0 ? (
        <FsmCard>
          <p className="m-0 text-[13.5px] text-text-3">{t('fsmUi.customer.contacts.empty')}</p>
        </FsmCard>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {contacts.map((contact) => (
            <FsmCard key={contact.id} testId={`customer-contact-${contact.id}`}>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Avatar name={contact.name} id={contact.id} size="lg" />
                  <div className="flex min-w-0 flex-col">
                    <span className="flex items-center gap-2 font-semibold">
                      {contact.name}
                      {contact.isPrimary ? (
                        <Pill tone="completed">{t('fsmUi.customer.sites.primary')}</Pill>
                      ) : null}
                    </span>
                    <span className="text-[12.5px] text-text-3">{contact.role ?? '—'}</span>
                  </div>
                </div>
                <KeyValues
                  items={[
                    { label: t('fsmUi.customer.details.mobile'), value: contact.mobile ?? '—' },
                    { label: t('fsmUi.customer.details.phone'), value: contact.phone ?? '—' },
                    { label: t('fsmUi.customer.details.email'), value: contact.email ?? '—' },
                    { label: t('fsmUi.customer.contacts.notes'), value: contact.notes ?? '—' },
                  ]}
                />
              </div>
            </FsmCard>
          ))}
        </div>
      )}
      <div className="flex items-start gap-3 rounded-[10px] border border-dashed border-border-button px-4 py-3.5">
        <IconTile icon={Building2} tone="slate" />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold">{t('fsmUi.customer.contacts.title')}</span>
          <span className="text-[12.5px] text-text-3">{t('fsmUi.customer.contacts.body')}</span>
        </div>
      </div>
    </div>
  );
}

const ROW =
  'grid min-h-[60px] items-center gap-4 border-b border-divider px-4 py-2 text-sm last:border-b-0';

function CustomerEquipmentTab({
  customer,
  equipment,
  now,
  canAdd,
}: {
  customer: CustomerDto;
  equipment: EquipmentDto[];
  now: string;
  canAdd: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const cols = 'grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_110px_120px_120px_130px_150px]';

  return (
    <FsmCard
      title={t('fsmUi.customer.equipment.title')}
      description={t('fsmUi.customer.equipment.body', { count: equipment.length })}
      action={
        canAdd ? (
          <Button variant="create" size="sm" asChild data-testid="customer-equipment-add">
            <Link
              href={`${ROUTES.fsm.equipment.new}?customerId=${encodeURIComponent(customer.id)}`}
            >
              <Plus aria-hidden="true" />
              {t('fsmUi.customer.equipment.add')}
            </Link>
          </Button>
        ) : null
      }
      padded={false}
      testId="customer-equipment"
    >
      <div className="overflow-x-auto border-t border-border">
        <div role="table" className="min-w-[900px]">
          <div
            role="row"
            className={cn(ROW, cols, 'min-h-10 bg-surface-2 text-[12px] font-semibold text-text-3')}
          >
            {(
              [
                'equipment',
                'site',
                'category',
                'status',
                'criticality',
                'lastService',
                'nextPreventive',
              ] as const
            ).map((key) => (
              <span key={key} role="columnheader">
                {t(`fsmUi.customer.equipment.columns.${key}`)}
              </span>
            ))}
          </div>
          {equipment.map((item) => {
            const days = item.nextPreventiveDate
              ? Math.round(
                  (Date.parse(`${item.nextPreventiveDate}T12:00:00Z`) - new Date(now).getTime()) /
                    86_400_000,
                )
              : null;
            return (
              <Link
                key={item.id}
                role="row"
                href={ROUTES.fsm.equipment.view(item.id)}
                className={cn(ROW, cols, 'hover:bg-surface-hover focus-visible:ring-focus')}
                data-testid={`customer-equipment-${item.id}`}
              >
                <span role="cell" className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate font-semibold">{item.name}</span>
                  <span className="truncate text-[12.5px] text-text-3">
                    <span className="font-mono">{item.tag}</span>
                    {item.model
                      ? ` · ${[item.manufacturer, item.model].filter(Boolean).join(' ')}`
                      : ''}
                  </span>
                </span>
                <span role="cell" className="truncate text-[13px] text-text-2">
                  {item.address?.label ?? item.address?.city ?? '—'}
                </span>
                <span role="cell" className="truncate text-[13px] text-text-2">
                  {item.category ?? '—'}
                </span>
                <span role="cell">
                  <EquipmentStatusPill status={item.status} />
                </span>
                <span role="cell">
                  {item.criticality ? (
                    <CriticalityPill criticality={item.criticality} short />
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </span>
                <span role="cell" className="text-[13px] text-text-2">
                  {item.lastService
                    ? `${formatShortDate(item.lastService.completedAt, locale)} · ${formatWorkOrderNumber(item.lastService.number)}`
                    : '—'}
                </span>
                <span role="cell" className="flex flex-col text-[13px]">
                  {item.nextPreventiveDate ? (
                    <>
                      <span className="text-text-2">
                        {formatShortDate(`${item.nextPreventiveDate}T12:00:00Z`, locale)}
                      </span>
                      <span
                        className={cn(
                          'text-[12px]',
                          days !== null && days < 0
                            ? 'font-semibold text-fsm-overdue'
                            : 'text-text-3',
                        )}
                      >
                        {days !== null && days < 0
                          ? t('fsmUi.customer.equipment.lateDays', { count: -days })
                          : t('fsmUi.customer.equipment.inDays', { count: days ?? 0 })}
                      </span>
                    </>
                  ) : (
                    <span className="text-text-muted">
                      {t('fsmUi.customer.equipment.noInterval')}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </FsmCard>
  );
}

function CustomerWorkOrders({
  workOrders,
  now,
  newHref,
}: {
  workOrders: WorkOrderListItemDto[];
  now: string;
  newHref: string | null;
}) {
  const t = useT();
  const locale = useLocale();
  const [statuses, setStatuses] = useState<WorkOrderStatus[]>([]);
  const shown = statuses.length
    ? workOrders.filter((order) => statuses.includes(order.status))
    : workOrders;
  const cols = 'grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_130px_100px_minmax(0,1fr)_120px]';

  return (
    <FsmCard
      title={t('fsmUi.customer.workOrders.title')}
      description={t('fsmUi.customer.workOrders.body', { count: workOrders.length })}
      action={
        newHref ? (
          <Button variant="create" size="sm" asChild>
            <Link href={newHref}>
              <Plus aria-hidden="true" />
              {t('fsmUi.customer.newWorkOrder')}
            </Link>
          </Button>
        ) : null
      }
      padded={false}
      testId="customer-work-orders"
    >
      <div className="flex flex-wrap gap-2 px-5 pb-4">
        {WORK_ORDER_STATUSES.map((status) => {
          const isOn = statuses.includes(status);
          return (
            <button
              key={status}
              type="button"
              aria-pressed={isOn}
              onClick={() =>
                setStatuses((current) =>
                  isOn ? current.filter((value) => value !== status) : [...current, status],
                )
              }
              className={cn(
                'inline-flex h-8 items-center gap-2 rounded-full border border-border-button bg-surface pr-2.5 pl-[9px] text-[13px] font-medium text-text-2 outline-none hover:bg-surface-hover focus-visible:ring-focus',
                isOn && 'border-foreground bg-foreground text-white hover:bg-foreground',
              )}
            >
              <i
                aria-hidden="true"
                className="block size-2 rounded-full"
                style={{ background: WORK_ORDER_STATUS_COLOR[status] }}
              />
              {t(`fsm.workOrders.status.${status}`)}
              <span
                className={cn(
                  'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-divider px-1.5 text-[11px] font-semibold tabular-nums',
                  isOn && 'bg-white/20 text-white',
                )}
              >
                {workOrders.filter((order) => order.status === status).length}
              </span>
            </button>
          );
        })}
      </div>
      {shown.length === 0 ? (
        <p className="m-0 border-t border-border px-5 py-5 text-[13.5px] text-text-3">
          {t('fsmUi.customer.workOrders.empty')}
        </p>
      ) : (
        <div className="overflow-x-auto border-t border-border">
          <div role="table" className="min-w-[860px]">
            <div
              role="row"
              className={cn(
                ROW,
                cols,
                'min-h-10 bg-surface-2 text-[12px] font-semibold text-text-3',
              )}
            >
              {(['workOrder', 'equipment', 'status', 'priority', 'technician', 'due'] as const).map(
                (key) => (
                  <span key={key} role="columnheader">
                    {t(`fsmUi.customer.workOrders.columns.${key}`)}
                  </span>
                ),
              )}
            </div>
            {shown.map((order) => {
              const due = dueSignal(order.dueAt, now, !isOpen(order.status), t, locale);
              return (
                <Link
                  key={order.id}
                  role="row"
                  href={ROUTES.fsm.workOrders.view(order.id)}
                  className={cn(ROW, cols, 'hover:bg-surface-hover focus-visible:ring-focus')}
                >
                  <span role="cell" className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate font-semibold">
                      <span className="mr-1.5 font-mono text-[12.5px] font-medium text-text-3">
                        {formatWorkOrderNumber(order.number)}
                      </span>
                      {order.title}
                    </span>
                    <span className="truncate text-[12.5px] text-text-3">{order.type.name}</span>
                  </span>
                  <span role="cell" className="truncate text-[13px] text-text-2">
                    {order.equipment?.name ?? '—'}
                  </span>
                  <span role="cell">
                    <WorkOrderStatusPill status={order.status} />
                  </span>
                  <span role="cell">
                    <PriorityBadge priority={order.priority} />
                  </span>
                  <span role="cell" className="min-w-0">
                    <PersonChip
                      name={order.assignee?.name ?? null}
                      id={order.assignee?.membershipId ?? null}
                      unassignedLabel={t('fsmUi.common.unassigned')}
                    />
                  </span>
                  <span
                    role="cell"
                    className={cn(
                      'text-[12.5px]',
                      due?.tone === 'critical' ? 'font-semibold text-fsm-overdue' : 'text-text-3',
                    )}
                  >
                    {order.status === 'COMPLETED' && order.completedAt
                      ? t('fsmUi.customer.workOrders.done', {
                          date: formatShortDate(order.completedAt, locale),
                        })
                      : order.status === 'CANCELLED'
                        ? t('fsm.workOrders.status.CANCELLED')
                        : (due?.text ?? '—')}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </FsmCard>
  );
}
