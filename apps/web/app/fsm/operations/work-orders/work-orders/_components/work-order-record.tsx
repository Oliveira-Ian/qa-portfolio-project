'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  CirclePause,
  CirclePlay,
  ClipboardList,
  History,
  LayoutGrid,
  Pencil,
  Wrench,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  allowedTransitions,
  formatWorkOrderNumber,
  isFinalStatus,
  type WorkOrderDto,
  type WorkOrderItemDto,
  type WorkOrderStatus,
} from '@oliveira/schemas';
import { IconTile, RecordHeader, RecordTabs } from '@/components/fsm/record-layout';
import { Pill, WorkOrderStatusPill } from '@/components/fsm/status-pill';
import { PriorityBadge } from '@/components/fsm/work-order-badges';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/format';
import { dueSignal, formatShortDateTime } from '@/lib/fsm-format';
import { translateApiMessage } from '@/lib/i18n/api-messages';
import { useLocale, useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import {
  addWorkOrderItemAction,
  addWorkOrderNoteAction,
  changeWorkOrderStatusAction,
  removeWorkOrderItemAction,
} from '../_actions/work-order-actions';
import { WorkOrderAside } from './work-order-aside';
import { WorkOrderExecution } from './work-order-execution';
import { WorkOrderHistory } from './work-order-history';
import { WorkOrderLifecycle } from './work-order-lifecycle';
import { WorkOrderOverview } from './work-order-overview';

export interface WorkOrderAbilities {
  canEdit: boolean;
  canChangeStatus: boolean;
  canExecute: boolean;
  /** The caller's membership — are they this work order's technician? */
  membershipId: string | null;
}

export type WorkOrderTab = 'overview' | 'execution' | 'history';

interface WorkOrderRecordProps {
  workOrder: WorkOrderDto;
  abilities: WorkOrderAbilities;
  tab: WorkOrderTab;
  /** The server's clock, so relative times read the same on the server and in the browser. */
  now: string;
}

type DialogKind = 'ON_HOLD' | 'CANCELLED' | 'COMPLETED';

/**
 * A work order and the work on it (boards FSM-05a/b/c): the header with the
 * status actions the caller may take now (`allowedTransitions` — the same rule
 * the API applies), its progress, and three tabs — Overview, Execution,
 * History — beside the assignment panel. A technician runs their own work
 * orders from here; a manager follows and steers them.
 */
export function WorkOrderRecord({ workOrder, abilities, tab, now }: WorkOrderRecordProps) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const [dialogText, setDialogText] = useState('');

  const isAssignee =
    abilities.membershipId !== null && abilities.membershipId === workOrder.assignee?.membershipId;
  const isExecutingAssignee = abilities.canExecute && isAssignee;
  const transitions = allowedTransitions(
    workOrder.status,
    { canChangeStatus: abilities.canChangeStatus, isExecutingAssignee },
    workOrder.assignee !== null,
  );
  const isFinal = isFinalStatus(workOrder.status);
  const canRecordItems =
    (workOrder.status === 'IN_PROGRESS' || workOrder.status === 'ON_HOLD') &&
    (abilities.canEdit || isExecutingAssignee);
  const canNote =
    !isFinal && (abilities.canEdit || abilities.canChangeStatus || isExecutingAssignee);
  const base = ROUTES.fsm.workOrders.view(workOrder.id);
  const due = dueSignal(workOrder.dueAt, now, isFinal, t, locale);
  const itemsTotal = workOrder.items.reduce(
    (sum, item) => sum + (item.unitPrice ? Number(item.unitPrice) * Number(item.quantity) : 0),
    0,
  );

  function run(work: () => Promise<{ success: boolean; message?: string }>, success: string) {
    return new Promise<boolean>((resolve) => {
      startTransition(async () => {
        const result = await work();

        if (!result.success) {
          toast.error(translateApiMessage(result.message ?? '', t));
          resolve(false);
          return;
        }

        toast.success(success);
        router.refresh();
        resolve(true);
      });
    });
  }

  function moveTo(status: WorkOrderStatus, extra: { reason?: string; resolution?: string } = {}) {
    void run(
      () => changeWorkOrderStatusAction(workOrder.id, { to: status, ...extra }),
      t('fsm.workOrders.actions.statusChanged', {
        status: t(`fsm.workOrders.status.${status}`).toLowerCase(),
      }),
    );
  }

  function handleDialogConfirm() {
    if (!dialog) {
      return;
    }
    const text = dialogText.trim();
    moveTo(dialog, dialog === 'COMPLETED' ? { resolution: text } : { reason: text });
    setDialog(null);
    setDialogText('');
  }

  const actionTestId = (status: WorkOrderStatus) =>
    `work-order-action-${status.toLowerCase().replace('_', '-')}`;
  const nextStep = transitions.find((status) => status === 'IN_PROGRESS' || status === 'COMPLETED');
  const nextIcon: LucideIcon = nextStep === 'COMPLETED' ? CheckCircle2 : CirclePlay;
  const nextLabel =
    nextStep === 'COMPLETED'
      ? t('fsm.workOrders.actions.complete')
      : workOrder.status === 'ON_HOLD'
        ? t('fsm.workOrders.actions.resume')
        : t('fsm.workOrders.actions.start');
  const NextIcon = nextIcon;

  const actions = (
    <>
      {abilities.canEdit && !isFinal ? (
        <Button variant="edit" asChild data-testid="work-order-record-button-edit">
          <Link
            href={`${ROUTES.fsm.workOrders.edit(workOrder.id)}${tab === 'overview' ? '' : `?from=${tab}`}`}
          >
            <Pencil aria-hidden="true" />
            {t('common.edit')}
          </Link>
        </Button>
      ) : null}
      {transitions.includes('CANCELLED') ? (
        <Button
          variant="destructive-soft"
          disabled={isPending}
          onClick={() => setDialog('CANCELLED')}
          data-testid={actionTestId('CANCELLED')}
        >
          <XCircle aria-hidden="true" />
          {t('fsm.workOrders.actions.cancel')}
        </Button>
      ) : null}
      {transitions.includes('ON_HOLD') || nextStep ? (
        <span aria-hidden="true" className="mx-1 hidden h-9 w-px bg-border sm:block" />
      ) : null}
      {transitions.includes('ON_HOLD') ? (
        <Button
          variant="outline"
          disabled={isPending}
          onClick={() => setDialog('ON_HOLD')}
          data-testid={actionTestId('ON_HOLD')}
        >
          <CirclePause aria-hidden="true" />
          {t('fsm.workOrders.actions.hold')}
        </Button>
      ) : null}
      {nextStep ? (
        <Button
          variant="confirm"
          disabled={isPending}
          onClick={() => (nextStep === 'IN_PROGRESS' ? moveTo(nextStep) : setDialog('COMPLETED'))}
          data-testid={actionTestId(nextStep)}
        >
          <NextIcon aria-hidden="true" />
          {nextLabel}
        </Button>
      ) : null}
    </>
  );

  return (
    <div className="flex flex-col gap-5" data-testid="work-order-record">
      <RecordHeader
        testId="work-order-header"
        tile={<IconTile icon={ClipboardList} size="lg" />}
        overline={
          <>
            <span className="font-mono text-[11.5px] font-medium tracking-normal">
              {formatWorkOrderNumber(workOrder.number)}
            </span>
            {` · ${workOrder.type.name}`}
            {workOrder.branch ? ` · ${workOrder.branch.code} ${workOrder.branch.name}` : ''}
          </>
        }
        title={workOrder.title}
        titleTestId="work-order-record-title"
        chips={
          <>
            <WorkOrderStatusPill status={workOrder.status} />
            <PriorityBadge priority={workOrder.priority} />
            {due ? (
              <>
                <span aria-hidden="true" className="h-4 w-px bg-border" />
                {due.tone === 'neutral' ? (
                  <span className="text-[13px] text-text-3">
                    {t('fsm.workOrders.record.dueAt')} {due.text}
                  </span>
                ) : (
                  <Pill
                    tone={due.tone}
                    data-testid={due.tone === 'critical' ? 'work-order-overdue' : undefined}
                  >
                    {due.text}
                  </Pill>
                )}
              </>
            ) : null}
          </>
        }
        actions={actions}
        strip={<WorkOrderLifecycle workOrder={workOrder} />}
        tabs={
          <RecordTabs
            label={t('fsmUi.workOrder.tabs.label')}
            current={tab}
            tabs={[
              {
                key: 'overview',
                label: t('fsmUi.workOrder.tabs.overview'),
                icon: LayoutGrid,
                href: base,
                testId: 'work-order-tab-overview',
              },
              {
                key: 'execution',
                label: t('fsmUi.workOrder.tabs.execution'),
                icon: Wrench,
                href: `${base}?tab=execution`,
                count: workOrder.items.length,
                testId: 'work-order-tab-execution',
              },
              {
                key: 'history',
                label: t('fsmUi.workOrder.tabs.history'),
                icon: History,
                href: `${base}?tab=history`,
                count: workOrder.events.length,
                testId: 'work-order-tab-history',
              },
            ]}
          />
        }
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        {tab === 'execution' ? (
          <WorkOrderExecution
            workOrder={workOrder}
            now={now}
            canRecordItems={canRecordItems}
            canNote={canNote}
            isPending={isPending}
            onAddItem={(catalogItemId, quantity) =>
              run(
                () => addWorkOrderItemAction(workOrder.id, { catalogItemId, quantity }),
                t('fsm.workOrders.record.itemAdded'),
              )
            }
            onRemoveItem={(item: WorkOrderItemDto) =>
              void run(
                () => removeWorkOrderItemAction(workOrder.id, item.id),
                t('fsm.workOrders.record.itemRemoved'),
              )
            }
            onAddNote={(message) =>
              run(
                () => addWorkOrderNoteAction(workOrder.id, message),
                t('fsm.workOrders.record.noteAdded'),
              )
            }
          />
        ) : tab === 'history' ? (
          <WorkOrderHistory events={workOrder.events} />
        ) : (
          <WorkOrderOverview workOrder={workOrder} executionHref={`${base}?tab=execution`} />
        )}
        <WorkOrderAside workOrder={workOrder} now={now} />
      </div>

      <AlertDialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
            setDialogText('');
          }
        }}
      >
        <AlertDialogContent data-testid="work-order-status-dialog">
          {dialog ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {dialog === 'COMPLETED'
                    ? `${t('fsm.workOrders.actions.complete')} ${formatWorkOrderNumber(workOrder.number)}`
                    : t(
                        dialog === 'ON_HOLD'
                          ? 'fsm.workOrders.actions.hold_.title'
                          : 'fsm.workOrders.actions.cancel_.title',
                      )}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {dialog === 'COMPLETED'
                    ? workOrder.title
                    : t(
                        dialog === 'ON_HOLD'
                          ? 'fsm.workOrders.actions.hold_.body'
                          : 'fsm.workOrders.actions.cancel_.body',
                      )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="grid gap-1.5">
                <Label htmlFor="work-order-status-text">
                  {t(
                    dialog === 'COMPLETED'
                      ? 'fsm.workOrders.actions.complete_.resolution'
                      : 'fsm.workOrders.actions.hold_.reason',
                  )}
                  <span className="ml-0.5 text-fsm-required" aria-hidden="true">
                    *
                  </span>
                </Label>
                <Textarea
                  id="work-order-status-text"
                  rows={dialog === 'COMPLETED' ? 5 : 3}
                  value={dialogText}
                  aria-required="true"
                  onChange={(event) => setDialogText(event.target.value)}
                  data-testid="work-order-status-text"
                />
                {dialog === 'COMPLETED' ? (
                  <p className="m-0 text-[12.5px] text-text-3">
                    {t('fsmUi.workOrder.execution.recap', {
                      total: formatCurrency(itemsTotal),
                      date: formatShortDateTime(workOrder.startedAt, locale),
                    })}
                  </p>
                ) : null}
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel variant="ghost" data-testid="work-order-status-cancel">
                  {t('fsm.workOrders.actions.keep')}
                </AlertDialogCancel>
                <AlertDialogAction
                  variant={dialog === 'CANCELLED' ? 'destructive' : 'confirm'}
                  disabled={dialogText.trim() === ''}
                  onClick={handleDialogConfirm}
                  data-testid="work-order-status-confirm"
                >
                  {t(
                    dialog === 'ON_HOLD'
                      ? 'fsm.workOrders.actions.hold'
                      : dialog === 'CANCELLED'
                        ? 'fsm.workOrders.actions.cancel'
                        : 'fsm.workOrders.actions.complete',
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : null}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
