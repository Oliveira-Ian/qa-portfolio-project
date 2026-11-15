'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CalendarClock,
  Cog,
  History,
  IdCard,
  LayoutGrid,
  MapPin,
  NotebookPen,
  Pencil,
  Plus,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import {
  formatAddress,
  formatWorkOrderNumber,
  type EquipmentDto,
  type WorkOrderListItemDto,
} from '@oliveira/schemas';
import {
  FsmCard,
  IconTile,
  OptionalBadge,
  ReadOnlyField,
  RecordFacts,
  RecordHeader,
  RecordTabs,
  SectionCard,
} from '@/components/fsm/record-layout';
import { PersonChip } from '@/components/fsm/person-chip';
import {
  CriticalityPill,
  EquipmentStatusPill,
  WorkOrderStatusPill,
} from '@/components/fsm/status-pill';
import { Button } from '@/components/ui/button';
import { formatDateMedium } from '@/lib/format';
import { formatShortDate, formatShortDateTime } from '@/lib/fsm-format';
import { useLocale, useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import { cn } from '@/lib/utils';

export type EquipmentTab = 'overview' | 'details' | 'history';

interface EquipmentRecordProps {
  equipment: EquipmentDto;
  /** Its work orders, newest first — `null` without `work-order:view`. */
  workOrders: WorkOrderListItemDto[] | null;
  tab: EquipmentTab;
  now: string;
  can: { edit: boolean; createWorkOrder: boolean };
}

const isOpen = (status: WorkOrderListItemDto['status']) =>
  status !== 'COMPLETED' && status !== 'CANCELLED';
const day = (value: string | null) => (value ? `${value}T12:00:00Z` : null);

/**
 * A customer's equipment (boards FSM-09a–c): header with model, serial,
 * installation, warranty and open work orders, then Overview (preventive
 * plan, recent service, where it is, lifecycle), Details (read-only) and
 * Service history.
 */
export function EquipmentRecord({ equipment, workOrders, tab, now, can }: EquipmentRecordProps) {
  const t = useT();
  const locale = useLocale();
  const base = ROUTES.fsm.equipment.view(equipment.id);
  const orders = workOrders ?? [];
  const warrantyValid = equipment.warrantyUntil
    ? equipment.warrantyUntil >= now.slice(0, 10)
    : null;
  const age = (() => {
    if (!equipment.installedAt) {
      return null;
    }
    const from = new Date(day(equipment.installedAt)!);
    const to = new Date(now);
    const months =
      (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + to.getUTCMonth() - from.getUTCMonth();
    return t('fsmUi.equipment.facts.age', {
      years: Math.floor(months / 12),
      months: months % 12,
    }).trim();
  })();
  const nextOpen = orders
    .filter((order) => isOpen(order.status))
    .sort((a, b) => (a.dueAt ?? '9').localeCompare(b.dueAt ?? '9'))[0];

  const tabs = [
    { key: 'overview', label: t('fsmUi.equipment.tabs.overview'), icon: LayoutGrid },
    { key: 'details', label: t('fsmUi.equipment.tabs.details'), icon: IdCard },
    ...(workOrders
      ? [
          {
            key: 'history',
            label: t('fsmUi.equipment.tabs.history'),
            icon: History,
            count: equipment.workOrderCount,
          },
        ]
      : []),
  ].map((item) => ({
    ...item,
    href: item.key === 'overview' ? base : `${base}?tab=${item.key}`,
    testId: `equipment-tab-${item.key}`,
  }));

  return (
    <div className="flex flex-col gap-5" data-testid="equipment-record">
      <RecordHeader
        testId="equipment-header"
        tile={<IconTile icon={Wrench} size="lg" />}
        overline={
          <>
            {t('fsmUi.equipment.overline')}
            {equipment.tag ? (
              <>
                {' · '}
                <span className="font-mono tracking-normal">{equipment.tag}</span>
              </>
            ) : null}
            {equipment.category ? ` · ${equipment.category}` : ''}
          </>
        }
        title={equipment.name}
        titleTestId="equipment-record-title"
        chips={
          <>
            <EquipmentStatusPill status={equipment.status} />
            {equipment.criticality ? <CriticalityPill criticality={equipment.criticality} /> : null}
            <span aria-hidden="true" className="h-4 w-px bg-border" />
            <Link
              href={ROUTES.fsm.customers.view(equipment.customer.id)}
              className="text-[13px] text-text-2 hover:underline"
            >
              {equipment.customer.name}
              {equipment.address?.label ? ` · ${equipment.address.label}` : ''}
            </Link>
          </>
        }
        actions={
          <>
            {can.edit ? (
              <Button variant="edit" asChild data-testid="equipment-form-button-edit">
                <Link href={ROUTES.fsm.equipment.edit(equipment.id)}>
                  <Pencil aria-hidden="true" />
                  {t('fsmUi.record.edit')}
                </Link>
              </Button>
            ) : null}
            {can.createWorkOrder && equipment.status !== 'INACTIVE' ? (
              <Button variant="create" asChild>
                <Link
                  href={`${ROUTES.fsm.workOrders.new}?customerId=${encodeURIComponent(equipment.customer.id)}`}
                >
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
                label: t('fsmUi.equipment.facts.model'),
                value: [equipment.manufacturer, equipment.model].filter(Boolean).join(' ') || '—',
              },
              {
                label: t('fsmUi.equipment.facts.serial'),
                value: equipment.serialNumber ? (
                  <span className="font-mono text-[14px]">{equipment.serialNumber}</span>
                ) : (
                  '—'
                ),
              },
              {
                label: t('fsmUi.equipment.facts.installed'),
                value: formatDateMedium(equipment.installedAt, locale),
                hint: age ?? undefined,
              },
              {
                label: t('fsmUi.equipment.facts.warranty'),
                value:
                  warrantyValid === null
                    ? '—'
                    : warrantyValid
                      ? t('fsmUi.equipment.facts.valid')
                      : t('fsmUi.equipment.facts.expired'),
                hint: equipment.warrantyUntil
                  ? t(
                      warrantyValid ? 'fsmUi.equipment.facts.until' : 'fsmUi.equipment.facts.ended',
                      {
                        date: formatDateMedium(equipment.warrantyUntil, locale),
                      },
                    )
                  : undefined,
              },
              {
                label: t('fsmUi.equipment.facts.open'),
                value: equipment.openWorkOrderCount,
                hint: nextOpen
                  ? `${formatWorkOrderNumber(nextOpen.number)}${nextOpen.dueAt ? ` · ${formatShortDate(nextOpen.dueAt, locale)}` : ''}`
                  : undefined,
              },
            ]}
          />
        }
        tabs={<RecordTabs label={t('fsmUi.record.tabsLabel')} current={tab} tabs={tabs} />}
      />

      {tab === 'details' ? (
        <EquipmentDetails equipment={equipment} />
      ) : tab === 'history' ? (
        <EquipmentHistory equipment={equipment} workOrders={orders} />
      ) : (
        <EquipmentOverview
          equipment={equipment}
          workOrders={orders}
          now={now}
          warrantyValid={warrantyValid}
        />
      )}
    </div>
  );
}

function EquipmentOverview({
  equipment,
  workOrders,
  now,
  warrantyValid,
}: {
  equipment: EquipmentDto;
  workOrders: WorkOrderListItemDto[];
  now: string;
  warrantyValid: boolean | null;
}) {
  const t = useT();
  const locale = useLocale();
  const nextDays = equipment.nextPreventiveDate
    ? Math.round(
        (Date.parse(`${equipment.nextPreventiveDate}T12:00:00Z`) - new Date(now).getTime()) /
          86_400_000,
      )
    : null;
  const scheduled = workOrders.find(
    (order) => order.status === 'SCHEDULED' || order.status === 'IN_PROGRESS',
  );
  const tile = (label: string, value: React.ReactNode, hint?: React.ReactNode) => (
    <div className="flex min-w-0 flex-col gap-1 rounded-[10px] border border-divider bg-surface-2 px-3.5 py-3">
      <span className="text-[12.5px] text-text-3">{label}</span>
      <span className="truncate text-[15px] font-semibold tabular-nums">{value}</span>
      {hint ? <span className="truncate text-[12px] text-text-3">{hint}</span> : null}
    </div>
  );

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-5">
        <FsmCard
          title={t('fsmUi.equipment.preventive.title')}
          description={
            equipment.maintenanceIntervalDays
              ? t('fsmUi.equipment.preventive.every', { count: equipment.maintenanceIntervalDays })
              : t('fsmUi.equipment.preventive.noPlan')
          }
          testId="equipment-preventive"
        >
          <div className="grid gap-3 md:grid-cols-3">
            {tile(
              t('fsmUi.equipment.preventive.last'),
              equipment.lastPreventive
                ? formatShortDate(equipment.lastPreventive.completedAt, locale)
                : '—',
              equipment.lastPreventive
                ? formatWorkOrderNumber(equipment.lastPreventive.number)
                : t('fsmUi.equipment.preventive.noneYet'),
            )}
            {tile(
              t('fsmUi.equipment.preventive.next'),
              equipment.nextPreventiveDate
                ? formatShortDate(day(equipment.nextPreventiveDate), locale)
                : '—',
              nextDays === null ? undefined : (
                <span className={cn(nextDays < 0 && 'font-semibold text-fsm-overdue')}>
                  {nextDays < 0
                    ? t('fsmUi.equipment.preventive.lateDays', { count: -nextDays })
                    : t('fsmUi.equipment.preventive.inDays', { count: nextDays })}
                  {!equipment.lastPreventive
                    ? ` · ${t('fsmUi.equipment.preventive.fromInstall')}`
                    : ''}
                </span>
              ),
            )}
            {tile(
              t('fsmUi.equipment.preventive.scheduled'),
              scheduled ? formatWorkOrderNumber(scheduled.number) : '—',
              scheduled ? (
                <span className="inline-flex items-center gap-2">
                  {formatShortDateTime(scheduled.scheduledAt, locale)}
                </span>
              ) : (
                t('fsmUi.equipment.preventive.noneScheduled')
              ),
            )}
          </div>
        </FsmCard>

        <FsmCard
          title={t('fsmUi.equipment.recent.title')}
          description={t('fsmUi.equipment.recent.body')}
          padded={false}
        >
          {workOrders.length === 0 ? (
            <p className="m-0 px-5 pb-5 text-[13.5px] text-text-3">
              {t('fsmUi.equipment.recent.empty')}
            </p>
          ) : (
            <ul className="m-0 list-none divide-y divide-divider border-t border-divider p-0">
              {workOrders.slice(0, 5).map((order) => (
                <li key={order.id}>
                  <Link
                    href={ROUTES.fsm.workOrders.view(order.id)}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3 hover:bg-surface-hover focus-visible:ring-focus"
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
                          order.completedAt
                            ? t('fsmUi.equipment.history.done', {
                                date: formatShortDate(order.completedAt, locale),
                              })
                            : formatShortDateTime(order.scheduledAt ?? order.createdAt, locale),
                          order.assignee?.name,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>
                    <WorkOrderStatusPill status={order.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </FsmCard>
      </div>

      <aside className="flex min-w-0 flex-col gap-5">
        <FsmCard title={t('fsmUi.equipment.where.title')}>
          <div className="flex items-start gap-3">
            <IconTile icon={MapPin} tone="slate" />
            <div className="flex min-w-0 flex-col gap-0.5 text-[13.5px]">
              <Link
                href={ROUTES.fsm.customers.view(equipment.customer.id)}
                className="font-semibold hover:underline"
              >
                {equipment.customer.name}
              </Link>
              {equipment.address ? (
                <span className="text-[12.5px] text-text-2">
                  {[equipment.address.label, formatAddress(equipment.address)]
                    .filter(Boolean)
                    .join(' — ')}
                </span>
              ) : null}
              <span className="text-[12.5px] text-text-3">
                {t('fsmUi.equipment.where.location', { location: equipment.location ?? '—' })}
              </span>
            </div>
          </div>
        </FsmCard>
        <FsmCard title={t('fsmUi.equipment.lifecycle.title')}>
          <div className="flex flex-col gap-2 text-[13.5px]">
            <span className="flex items-center gap-2">
              <CalendarClock aria-hidden="true" className="size-4 text-text-muted" />
              {equipment.installedAt
                ? t('fsmUi.equipment.lifecycle.installed', {
                    date: formatDateMedium(equipment.installedAt, locale),
                  })
                : '—'}
            </span>
            {equipment.warrantyUntil ? (
              <span className="flex items-center gap-2">
                <ShieldCheck aria-hidden="true" className="size-4 text-text-muted" />
                {t(
                  warrantyValid
                    ? 'fsmUi.equipment.lifecycle.warrantyUntil'
                    : 'fsmUi.equipment.lifecycle.warrantyEnded',
                  {
                    date: formatDateMedium(equipment.warrantyUntil, locale),
                  },
                )}
              </span>
            ) : null}
            {warrantyValid !== null ? (
              <p
                className={cn(
                  'm-0 mt-1 rounded-[10px] px-3 py-2 text-[12.5px] leading-[18px] font-medium',
                  warrantyValid
                    ? 'bg-fsm-completed-bg text-fsm-completed-fg'
                    : 'bg-fsm-warning-bg text-fsm-warning-fg',
                )}
              >
                {t(
                  warrantyValid
                    ? 'fsmUi.equipment.lifecycle.inWarranty'
                    : 'fsmUi.equipment.lifecycle.outOfWarranty',
                )}
              </p>
            ) : null}
          </div>
        </FsmCard>
      </aside>
    </div>
  );
}

function EquipmentDetails({ equipment }: { equipment: EquipmentDto }) {
  const t = useT();
  const locale = useLocale();

  return (
    <div className="flex max-w-[1128px] flex-col gap-4">
      <SectionCard
        icon={MapPin}
        title={t('fsmUi.equipment.details.customerSite')}
        description={t('fsmUi.equipment.details.customerSiteBody')}
      >
        <ReadOnlyField
          label={t('fsmUi.equipment.details.customer')}
          value={
            <Link
              href={ROUTES.fsm.customers.view(equipment.customer.id)}
              className="hover:underline"
            >
              {equipment.customer.name}
            </Link>
          }
          span="col-span-12 md:col-span-6"
        />
        <ReadOnlyField
          label={t('fsmUi.equipment.details.site')}
          value={
            equipment.address
              ? [equipment.address.label, formatAddress(equipment.address)]
                  .filter(Boolean)
                  .join(' — ')
              : null
          }
          span="col-span-12 md:col-span-6"
        />
        <ReadOnlyField
          label={t('fsmUi.equipment.details.location')}
          value={equipment.location}
          span="col-span-12"
        />
      </SectionCard>

      <SectionCard
        icon={IdCard}
        title={t('fsmUi.equipment.details.identification')}
        description={t('fsmUi.equipment.details.identificationBody')}
      >
        <ReadOnlyField
          label={t('fsmUi.equipment.details.name')}
          value={equipment.name}
          span="col-span-12 md:col-span-6"
        />
        <ReadOnlyField
          label={t('fsmUi.equipment.details.tag')}
          value={equipment.tag}
          mono
          span="col-span-6 md:col-span-3"
        />
        <ReadOnlyField
          label={t('fsmUi.equipment.details.category')}
          value={equipment.category}
          span="col-span-6 md:col-span-3"
        />
        <ReadOnlyField
          label={t('fsmUi.equipment.details.manufacturer')}
          value={equipment.manufacturer}
          span="col-span-6 md:col-span-4"
        />
        <ReadOnlyField
          label={t('fsmUi.equipment.details.model')}
          value={equipment.model}
          span="col-span-6 md:col-span-4"
        />
        <ReadOnlyField
          label={t('fsmUi.equipment.details.serial')}
          value={equipment.serialNumber}
          mono
          span="col-span-12 md:col-span-4"
        />
      </SectionCard>

      <SectionCard
        icon={CalendarClock}
        title={t('fsmUi.equipment.details.lifecycle')}
        description={t('fsmUi.equipment.details.lifecycleBody')}
      >
        <ReadOnlyField
          label={t('fsmUi.equipment.details.installed')}
          value={equipment.installedAt ? formatDateMedium(equipment.installedAt, locale) : null}
          span="col-span-6 md:col-span-4"
        />
        <ReadOnlyField
          label={t('fsmUi.equipment.details.warrantyUntil')}
          value={equipment.warrantyUntil ? formatDateMedium(equipment.warrantyUntil, locale) : null}
          span="col-span-6 md:col-span-4"
        />
        <ReadOnlyField
          label={t('fsmUi.equipment.details.status')}
          value={<EquipmentStatusPill status={equipment.status} />}
          span="col-span-12 md:col-span-4"
        />
      </SectionCard>

      <SectionCard
        icon={Cog}
        title={t('fsmUi.equipment.details.maintenance')}
        description={t('fsmUi.equipment.details.maintenanceBody')}
      >
        <ReadOnlyField
          label={t('fsmUi.equipment.details.criticality')}
          value={
            equipment.criticality ? (
              <CriticalityPill criticality={equipment.criticality} short />
            ) : null
          }
          span="col-span-6 md:col-span-4"
        />
        <ReadOnlyField
          label={t('fsmUi.equipment.details.interval')}
          value={
            equipment.maintenanceIntervalDays
              ? t('fsmUi.equipment.details.intervalValue', {
                  count: equipment.maintenanceIntervalDays,
                })
              : null
          }
          span="col-span-6 md:col-span-4"
        />
        <ReadOnlyField
          label={t('fsmUi.equipment.details.nextCalculated')}
          value={
            equipment.nextPreventiveDate
              ? formatShortDate(day(equipment.nextPreventiveDate), locale)
              : null
          }
          span="col-span-12 md:col-span-4"
        />
      </SectionCard>

      <SectionCard
        icon={NotebookPen}
        title={t('fsmUi.equipment.details.notes')}
        description={t('fsmUi.equipment.details.notesBody')}
        badge={<OptionalBadge label={t('fsmUi.common.optional')} />}
      >
        <ReadOnlyField
          label={t('fsmUi.equipment.details.notes')}
          value={equipment.notes}
          multiline
          span="col-span-12"
        />
      </SectionCard>
    </div>
  );
}

function EquipmentHistory({
  equipment,
  workOrders,
}: {
  equipment: EquipmentDto;
  workOrders: WorkOrderListItemDto[];
}) {
  const t = useT();
  const locale = useLocale();
  const types = [...new Set(workOrders.map((order) => order.type.name))];
  const [type, setType] = useState<string | null>(null);
  const shown = type ? workOrders.filter((order) => order.type.name === type) : workOrders;
  const completed = workOrders.filter((order) => order.status === 'COMPLETED');
  const cols = 'grid-cols-[minmax(0,1.6fr)_130px_minmax(0,1fr)_160px]';
  const stat = (label: string, value: React.ReactNode, hint?: string) => (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-xl border border-border bg-surface px-5 py-4 shadow-fsm-card">
      <span className="text-[12.5px] text-text-3">{label}</span>
      <span className="text-[26px] leading-8 font-semibold tabular-nums">{value}</span>
      {hint ? <span className="text-[12px] text-text-3">{hint}</span> : null}
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stat(t('fsmUi.equipment.history.workOrders'), equipment.workOrderCount)}
        {stat(t('fsmUi.equipment.history.completed'), completed.length)}
        {stat(t('fsmUi.equipment.history.open'), equipment.openWorkOrderCount)}
        {stat(
          t('fsmUi.equipment.history.lastCompleted'),
          equipment.lastService ? formatShortDate(equipment.lastService.completedAt, locale) : '—',
          equipment.lastService ? formatWorkOrderNumber(equipment.lastService.number) : undefined,
        )}
      </div>
      <FsmCard
        title={t('fsmUi.equipment.history.title')}
        description={t('fsmUi.equipment.history.body')}
        padded={false}
        testId="equipment-work-orders"
      >
        <div className="flex flex-wrap gap-2 px-5 pb-4">
          {[null, ...types].map((value) => {
            const isOn = type === value;
            return (
              <button
                key={value ?? 'all'}
                type="button"
                aria-pressed={isOn}
                onClick={() => setType(value)}
                className={cn(
                  'inline-flex h-8 items-center gap-2 rounded-full border border-border-button bg-surface px-3 text-[13px] font-medium text-text-2 outline-none hover:bg-surface-hover focus-visible:ring-focus',
                  isOn && 'border-foreground bg-foreground text-white hover:bg-foreground',
                )}
              >
                {value ?? t('fsmUi.equipment.history.all')}
                <span
                  className={cn(
                    'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-divider px-1.5 text-[11px] font-semibold tabular-nums',
                    isOn && 'bg-white/20 text-white',
                  )}
                >
                  {value
                    ? workOrders.filter((order) => order.type.name === value).length
                    : workOrders.length}
                </span>
              </button>
            );
          })}
        </div>
        {shown.length === 0 ? (
          <p className="m-0 border-t border-border px-5 py-5 text-[13.5px] text-text-3">
            {t('fsmUi.equipment.recent.empty')}
          </p>
        ) : (
          <div className="overflow-x-auto border-t border-border">
            <div role="table" className="min-w-[760px]">
              <div
                role="row"
                className={cn(
                  'grid min-h-10 items-center gap-4 bg-surface-2 px-4 text-[12px] font-semibold text-text-3',
                  cols,
                )}
              >
                {(['workOrder', 'status', 'technician', 'date'] as const).map((key) => (
                  <span key={key} role="columnheader">
                    {t(`fsmUi.equipment.history.columns.${key}`)}
                  </span>
                ))}
              </div>
              {shown.map((order) => (
                <Link
                  key={order.id}
                  role="row"
                  href={ROUTES.fsm.workOrders.view(order.id)}
                  className={cn(
                    'grid min-h-[60px] items-center gap-4 border-t border-divider px-4 py-2 text-sm hover:bg-surface-hover focus-visible:ring-focus',
                    cols,
                  )}
                >
                  <span role="cell" className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate font-semibold">
                      <span className="mr-1.5 font-mono text-[12.5px] font-medium text-text-3">
                        {formatWorkOrderNumber(order.number)}
                      </span>
                      {order.title}
                    </span>
                    <span className="truncate text-[12.5px] text-text-3">
                      {[order.type.name, order.branch?.code].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span role="cell">
                    <WorkOrderStatusPill status={order.status} />
                  </span>
                  <span role="cell" className="min-w-0">
                    <PersonChip
                      name={order.assignee?.name ?? null}
                      id={order.assignee?.membershipId ?? null}
                      unassignedLabel={t('fsmUi.common.unassigned')}
                    />
                  </span>
                  <span role="cell" className="text-[13px] text-text-2">
                    {order.completedAt
                      ? t('fsmUi.equipment.history.done', {
                          date: formatShortDate(order.completedAt, locale),
                        })
                      : formatShortDateTime(order.scheduledAt ?? order.createdAt, locale)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </FsmCard>
    </div>
  );
}
