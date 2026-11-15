'use client';

import Link from 'next/link';
import { ArrowRight, ClipboardList, ExternalLink, MapPin, ShieldAlert, Wrench } from 'lucide-react';
import { formatAddress, type WorkOrderDto } from '@oliveira/schemas';
import { CriticalityPill } from '@/components/fsm/status-pill';
import { Callout, FsmCard, IconTile, KeyValues } from '@/components/fsm/record-layout';
import { formatShortDate } from '@/lib/fsm-format';
import { useLocale, useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import { WorkOrderItemsTable } from './work-order-items-table';

/** The Overview tab (board FSM-05a): the job, the equipment and the site, and the items so far. */
export function WorkOrderOverview({
  workOrder,
  executionHref,
}: {
  workOrder: WorkOrderDto;
  executionHref: string;
}) {
  const t = useT();
  const locale = useLocale();
  const address = workOrder.serviceAddress;
  const equipment = workOrder.equipment;
  const details = workOrder.equipmentDetails;
  const mapsQuery = address ? encodeURIComponent(formatAddress(address)) : null;

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <FsmCard
        title={t('fsmUi.workOrder.job.title')}
        description={t('fsmUi.workOrder.job.description')}
        testId="work-order-job"
      >
        <div className="flex flex-col gap-4">
          {workOrder.serviceInstructions ? (
            <Callout
              icon={ShieldAlert}
              title={t('fsmUi.workOrder.job.instructions')}
              testId="work-order-instructions"
            >
              {workOrder.serviceInstructions}
            </Callout>
          ) : null}
          <div className="flex flex-col gap-1">
            <span className="text-[13px] font-medium text-text-2">
              {t('fsmUi.workOrder.job.descriptionLabel')}
            </span>
            <p className="m-0 text-sm leading-[21px] whitespace-pre-line text-foreground">
              {workOrder.description ?? (
                <span className="text-text-muted">{t('fsmUi.workOrder.job.noDescription')}</span>
              )}
            </p>
          </div>
        </div>
      </FsmCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <FsmCard
          title={t('fsmUi.workOrder.equipment.title')}
          action={
            equipment ? (
              <Link
                href={ROUTES.fsm.equipment.view(equipment.id)}
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent-600 hover:underline"
              >
                {t('fsmUi.common.open')}
                <ArrowRight aria-hidden="true" className="size-3.5" />
              </Link>
            ) : null
          }
        >
          {equipment ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <IconTile icon={Wrench} tone="slate" />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-semibold">{equipment.name}</span>
                  {equipment.tag ? (
                    <span className="font-mono text-[12.5px] font-medium text-text-3">
                      {equipment.tag}
                    </span>
                  ) : null}
                  <span className="text-[12.5px] text-text-3">
                    {[details?.manufacturer, details?.model, details?.category]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </span>
                </div>
              </div>
              <KeyValues
                items={[
                  {
                    label: t('fsmUi.workOrder.equipment.criticality'),
                    value: details?.criticality ? (
                      <CriticalityPill criticality={details.criticality} short />
                    ) : (
                      '—'
                    ),
                  },
                  {
                    label: t('fsmUi.workOrder.equipment.lastService'),
                    value: details?.lastServiceAt
                      ? formatShortDate(details.lastServiceAt, locale)
                      : t('fsmUi.workOrder.equipment.noService'),
                  },
                ]}
              />
            </div>
          ) : (
            <p className="m-0 text-[13.5px] text-text-3">{t('fsmUi.workOrder.equipment.none')}</p>
          )}
        </FsmCard>

        <FsmCard
          title={t('fsmUi.workOrder.site.title')}
          action={
            mapsQuery ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent-600 hover:underline"
              >
                {t('fsmUi.common.openInMaps')}
                <ExternalLink aria-hidden="true" className="size-3.5" />
              </a>
            ) : null
          }
        >
          {address ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <IconTile icon={MapPin} tone="slate" />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-semibold">
                    {address.label ?? t(`common.address.types.${address.type}`)}
                  </span>
                  <span className="text-[13px] text-text-2">{formatAddress(address)}</span>
                  {address.reference ? (
                    <span className="text-[12.5px] text-text-3">{address.reference}</span>
                  ) : null}
                </div>
              </div>
              <KeyValues
                items={[
                  { label: t('fsmUi.workOrder.site.receives'), value: address.serviceHours ?? '—' },
                ]}
              />
            </div>
          ) : (
            <p className="m-0 text-[13.5px] text-text-3">{t('fsmUi.workOrder.site.none')}</p>
          )}
        </FsmCard>
      </div>

      <FsmCard
        title={t('fsmUi.workOrder.materials.title')}
        description={t('fsmUi.workOrder.materials.summary')}
        action={
          <Link
            href={executionHref}
            scroll={false}
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent-600 hover:underline"
          >
            <ClipboardList aria-hidden="true" className="size-3.5" />
            {t('fsmUi.workOrder.materials.goToExecution')}
          </Link>
        }
      >
        <WorkOrderItemsTable items={workOrder.items} />
      </FsmCard>
    </div>
  );
}
