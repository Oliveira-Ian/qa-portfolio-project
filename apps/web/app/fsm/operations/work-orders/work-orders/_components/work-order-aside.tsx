'use client';

import Link from 'next/link';
import { Phone } from 'lucide-react';
import type { WorkOrderDto } from '@oliveira/schemas';
import { FsmCard, KeyValues } from '@/components/fsm/record-layout';
import { Avatar, PersonChip } from '@/components/fsm/person-chip';
import {
  dueSignal,
  formatDuration,
  formatShortDate,
  formatShortDateTime,
  formatTime,
} from '@/lib/fsm-format';
import { useLocale, useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import { cn } from '@/lib/utils';

/**
 * The work order's side panel (board FSM-05, 340px): who and when, the
 * customer and who receives the technician, and the record's details — the
 * same on every tab.
 */
export function WorkOrderAside({ workOrder, now }: { workOrder: WorkOrderDto; now: string }) {
  const t = useT();
  const locale = useLocale();
  const isFinished = workOrder.status === 'COMPLETED' || workOrder.status === 'CANCELLED';
  const due = dueSignal(workOrder.dueAt, now, isFinished, t, locale);
  const end =
    workOrder.scheduledAt && workOrder.estimatedMinutes
      ? new Date(
          new Date(workOrder.scheduledAt).getTime() + workOrder.estimatedMinutes * 60_000,
        ).toISOString()
      : null;
  const used =
    workOrder.dueAt && !isFinished
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(
              ((new Date(now).getTime() - new Date(workOrder.createdAt).getTime()) /
                (new Date(workOrder.dueAt).getTime() - new Date(workOrder.createdAt).getTime())) *
                100,
            ),
          ),
        )
      : null;
  const branch = workOrder.branch ? `${workOrder.branch.code} · ${workOrder.branch.name}` : null;
  const city = workOrder.serviceAddress?.city;
  const contact = workOrder.contact;
  const contactPhone = contact?.mobile ?? contact?.phone;

  return (
    <aside className="flex min-w-0 flex-col gap-5" data-testid="work-order-aside">
      <FsmCard title={t('fsmUi.workOrder.aside.assignment')}>
        <div className="flex flex-col gap-4">
          <PersonChip
            name={workOrder.assignee?.name ?? null}
            id={workOrder.assignee?.membershipId ?? null}
            unassignedLabel={t('fsmUi.common.unassigned')}
            size="lg"
            subline={
              workOrder.assignee
                ? branch
                  ? t('fsmUi.workOrder.aside.technicianRole', { branch: workOrder.branch!.code })
                  : t('fsmUi.workOrder.aside.technicianNoBranch')
                : undefined
            }
          />
          <div className="flex flex-col gap-1 rounded-[10px] border border-divider bg-surface-2 px-3.5 py-3">
            <span className="text-[12.5px] text-text-3">{t('fsmUi.workOrder.aside.window')}</span>
            <span className="text-[13.5px] font-semibold tabular-nums">
              {workOrder.scheduledAt
                ? `${formatShortDateTime(workOrder.scheduledAt, locale)}${end ? ` → ${formatTime(end, locale)}` : ''}`
                : t('fsmUi.workOrder.aside.notScheduled')}
            </span>
            {workOrder.estimatedMinutes ? (
              <span className="text-[12.5px] text-text-3">
                {t('fsmUi.workOrder.aside.estimated', {
                  time: formatDuration(workOrder.estimatedMinutes, t),
                })}
              </span>
            ) : null}
          </div>
          <div className="flex flex-col gap-1 rounded-[10px] border border-divider bg-surface-2 px-3.5 py-3">
            <span className="text-[12.5px] text-text-3">{t('fsmUi.workOrder.aside.due')}</span>
            <span className="text-[13.5px] font-semibold tabular-nums">
              {workOrder.dueAt
                ? formatShortDateTime(workOrder.dueAt, locale)
                : t('fsmUi.workOrder.aside.noDue')}
            </span>
            {due ? (
              <span
                className={cn(
                  'text-[12.5px] font-medium',
                  due.tone === 'critical' && 'text-fsm-overdue',
                  due.tone === 'warning' && 'text-fsm-warning-fg',
                  due.tone === 'neutral' && 'text-text-3',
                )}
              >
                {due.text}
              </span>
            ) : null}
            {used !== null ? (
              <>
                <span
                  aria-hidden="true"
                  className="mt-1 h-1.5 overflow-hidden rounded-full bg-divider"
                >
                  <span
                    className={cn(
                      'block h-full rounded-full',
                      used >= 100
                        ? 'bg-fsm-critical'
                        : used >= 75
                          ? 'bg-fsm-warning'
                          : 'bg-fsm-completed',
                    )}
                    style={{ width: `${used}%` }}
                  />
                </span>
                <span className="text-[12px] text-text-3">
                  {t('fsmUi.workOrder.aside.openedOn', {
                    date: formatShortDate(workOrder.createdAt, locale),
                  })}{' '}
                  · {t('fsmUi.workOrder.aside.timeUsed', { percent: used })}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </FsmCard>

      <FsmCard title={t('fsmUi.workOrder.aside.customer')}>
        <div className="flex flex-col gap-3 text-[13.5px]">
          <div className="flex flex-col gap-0.5">
            <Link
              href={ROUTES.fsm.customers.view(workOrder.customer.id)}
              className="font-semibold text-foreground underline-offset-2 hover:underline"
            >
              {workOrder.customer.name}
            </Link>
            <span className="text-[12.5px] text-text-3">
              {[city, workOrder.customerPhone].filter(Boolean).join(' · ') || '—'}
            </span>
          </div>
          <div className="flex items-center gap-2.5 border-t border-divider pt-3">
            <Avatar name={contact?.name ?? null} id={contact?.id ?? null} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className={cn('truncate font-medium', !contact && 'text-text-muted')}>
                {contact?.name ?? t('fsmUi.workOrder.aside.noContact')}
              </span>
              <span className="truncate text-[12.5px] text-text-3">
                {contact
                  ? [contact.role, contactPhone].filter(Boolean).join(' · ') ||
                    t('fsmUi.workOrder.aside.contact')
                  : t('fsmUi.workOrder.aside.contact')}
              </span>
            </div>
            {contactPhone ? (
              <a
                href={`tel:${contactPhone.replace(/[^\d+]/g, '')}`}
                aria-label={`${t('fsmUi.common.call')} ${contact?.name ?? ''}`}
                className="inline-flex size-8 items-center justify-center rounded-lg border border-border-button text-text-2 hover:bg-surface-hover focus-visible:ring-focus"
              >
                <Phone aria-hidden="true" className="size-4" />
              </a>
            ) : null}
          </div>
        </div>
      </FsmCard>

      <FsmCard title={t('fsmUi.workOrder.aside.details')}>
        <KeyValues
          labelWidth={104}
          items={[
            { label: t('fsmUi.workOrder.aside.type'), value: workOrder.type.name },
            { label: t('fsmUi.workOrder.aside.branch'), value: branch ?? '—' },
            {
              label: t('fsmUi.workOrder.aside.reference'),
              value: workOrder.externalReference ? (
                <span className="font-mono text-[12.5px] font-medium">
                  {workOrder.externalReference}
                </span>
              ) : (
                '—'
              ),
            },
            {
              label: t('fsmUi.workOrder.aside.openedBy'),
              value: `${workOrder.createdBy} · ${formatShortDate(workOrder.createdAt, locale)}`,
            },
          ]}
        />
      </FsmCard>
    </aside>
  );
}
