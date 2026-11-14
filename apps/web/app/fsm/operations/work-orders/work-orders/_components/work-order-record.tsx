'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRightLeft,
  CheckCircle2,
  CirclePlay,
  CirclePause,
  ClipboardList,
  MessageSquare,
  Package,
  Pencil,
  Trash2,
  UserCheck,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  allowedTransitions,
  formatAddress,
  formatWorkOrderNumber,
  isFinalStatus,
  type WorkOrderDto,
  type WorkOrderEventDto,
  type WorkOrderStatus,
} from '@oliveira/schemas';
import { FormSection } from '@/components/forms/form-section';
import { SectionBlock } from '@/components/forms/record-form';
import { PageHeader } from '@/components/layout/page-header';
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
import { AsyncCombobox } from '@/components/ui/async-combobox';
import { Button } from '@/components/ui/button';
import { DescriptionList } from '@/components/ui/description-list';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Timeline } from '@/components/ui/timeline';
import { formatCurrency, formatDateTimeMedium } from '@/lib/format';
import { translateApiMessage } from '@/lib/i18n/api-messages';
import { useLocale, useT } from '@/lib/i18n/provider';
import type { Translator } from '@/lib/i18n/translate';
import { ROUTES } from '@/lib/navigation/routes';
import {
  addWorkOrderItemAction,
  addWorkOrderNoteAction,
  changeWorkOrderStatusAction,
  removeWorkOrderItemAction,
  searchCatalogItemsAction,
} from '../_actions/work-order-actions';
import {
  OverdueBadge,
  PriorityBadge,
  WorkOrderStatusBadge,
} from '@/components/fsm/work-order-badges';

export interface WorkOrderAbilities {
  canEdit: boolean;
  canChangeStatus: boolean;
  canExecute: boolean;
  /** The caller's membership — are they this work order's technician? */
  membershipId: string | null;
}

interface WorkOrderRecordProps {
  workOrder: WorkOrderDto;
  abilities: WorkOrderAbilities;
  /** Where Back goes: the list it was opened from. */
  backHref: string;
}

type DialogKind = 'ON_HOLD' | 'CANCELLED' | 'COMPLETED';

const EVENT_ICON: Record<WorkOrderEventDto['type'], LucideIcon> = {
  CREATED: ClipboardList,
  UPDATED: Pencil,
  ASSIGNED: UserCheck,
  UNASSIGNED: UserCheck,
  STATUS_CHANGED: ArrowRightLeft,
  NOTE: MessageSquare,
  ITEM_ADDED: Package,
  ITEM_REMOVED: Package,
};

function eventTitle(event: WorkOrderEventDto, t: Translator): string {
  if (event.type === 'STATUS_CHANGED' && event.toStatus) {
    return event.fromStatus
      ? t('fsm.workOrders.events.STATUS_CHANGED', {
          from: t(`fsm.workOrders.status.${event.fromStatus}`),
          to: t(`fsm.workOrders.status.${event.toStatus}`),
        })
      : t(`fsm.workOrders.status.${event.toStatus}`);
  }

  if (event.type === 'ASSIGNED') {
    return t('fsm.workOrders.events.ASSIGNED', { name: event.message ?? '' });
  }

  return t(`fsm.workOrders.events.${event.type}`);
}

/**
 * A work order, and the work on it: its details, the status actions the
 * caller may take now (`allowedTransitions` — the same rule the API applies),
 * the materials and services used, notes and the full history. A technician
 * runs their own work orders from here; a manager follows and steers them.
 */
export function WorkOrderRecord({ workOrder, abilities, backHref }: WorkOrderRecordProps) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const [dialogText, setDialogText] = useState('');
  const [note, setNote] = useState('');
  const [itemChoice, setItemChoice] = useState<{ id: string; label: string } | null>(null);
  const [quantity, setQuantity] = useState('1');

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

  function run(work: () => Promise<{ success: boolean; message?: string }>, success: string) {
    startTransition(async () => {
      const result = await work();

      if (!result.success) {
        toast.error(translateApiMessage(result.message ?? '', t));
        return;
      }

      toast.success(success);
      router.refresh();
    });
  }

  function moveTo(status: WorkOrderStatus, extra: { reason?: string; resolution?: string } = {}) {
    run(
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

  const actionButtons: { status: WorkOrderStatus; label: string; icon: LucideIcon }[] = [];

  for (const status of transitions) {
    if (status === 'IN_PROGRESS') {
      actionButtons.push({
        status,
        label: t(
          workOrder.status === 'ON_HOLD'
            ? 'fsm.workOrders.actions.resume'
            : 'fsm.workOrders.actions.start',
        ),
        icon: CirclePlay,
      });
    } else if (status === 'ON_HOLD') {
      actionButtons.push({ status, label: t('fsm.workOrders.actions.hold'), icon: CirclePause });
    } else if (status === 'COMPLETED') {
      actionButtons.push({
        status,
        label: t('fsm.workOrders.actions.complete'),
        icon: CheckCircle2,
      });
    } else if (status === 'CANCELLED') {
      actionButtons.push({ status, label: t('fsm.workOrders.actions.cancel'), icon: XCircle });
    }
  }

  const address = workOrder.serviceAddress;
  const totalItems = workOrder.items.reduce(
    (sum, item) => sum + (item.unitPrice ? Number(item.unitPrice) * Number(item.quantity) : 0),
    0,
  );

  return (
    <div className="max-w-[60rem]" data-testid="work-order-record">
      <PageHeader
        title={`${formatWorkOrderNumber(workOrder.number)} · ${workOrder.title}`}
        titleTestId="work-order-record-title"
        meta={
          <span className="flex flex-wrap items-center gap-1.5">
            <WorkOrderStatusBadge status={workOrder.status} />
            <PriorityBadge priority={workOrder.priority} />
            {workOrder.isOverdue ? <OverdueBadge /> : null}
          </span>
        }
        actions={
          <>
            <Button variant="ghost" asChild data-testid="work-order-record-button-back">
              <Link href={backHref}>{t('common.back')}</Link>
            </Button>
            {abilities.canEdit && !isFinal ? (
              <Button variant="outline" asChild data-testid="work-order-record-button-edit">
                <Link href={ROUTES.fsm.workOrders.edit(workOrder.id)}>
                  <Pencil aria-hidden="true" />
                  {t('common.edit')}
                </Link>
              </Button>
            ) : null}
            {actionButtons.map(({ status, label, icon: Icon }) => (
              <Button
                key={status}
                variant={
                  status === 'CANCELLED'
                    ? 'destructive-soft'
                    : status === 'ON_HOLD'
                      ? 'outline'
                      : 'default'
                }
                disabled={isPending}
                onClick={() =>
                  status === 'IN_PROGRESS' ? moveTo(status) : setDialog(status as DialogKind)
                }
                data-testid={`work-order-action-${status.toLowerCase().replace('_', '-')}`}
              >
                <Icon aria-hidden="true" />
                {label}
              </Button>
            ))}
          </>
        }
      />

      <div className="divide-y divide-border overflow-clip rounded-xl border border-border bg-surface">
        <SectionBlock>
          <FormSection
            title={t('fsm.workOrders.record.details')}
            description={t('fsm.workOrders.record.detailsBody')}
          >
            <DescriptionList
              items={[
                {
                  label: t('fsm.workOrders.record.customer'),
                  value: (
                    <Link
                      href={ROUTES.fsm.customers.view(workOrder.customer.id)}
                      className="text-primary hover:underline"
                    >
                      {workOrder.customer.name}
                    </Link>
                  ),
                },
                {
                  label: t('fsm.workOrders.record.equipment'),
                  value: workOrder.equipment ? (
                    <Link
                      href={ROUTES.fsm.equipment.view(workOrder.equipment.id)}
                      className="text-primary hover:underline"
                    >
                      {workOrder.equipment.name}
                    </Link>
                  ) : (
                    '—'
                  ),
                },
                {
                  label: t('fsm.workOrders.record.address'),
                  value: address
                    ? [address.label, formatAddress(address), address.reference]
                        .filter(Boolean)
                        .join(' · ')
                    : '—',
                  className: 'sm:col-span-2',
                },
                { label: t('fsm.workOrders.record.type'), value: workOrder.type.name },
                {
                  label: t('fsm.workOrders.record.branch'),
                  value: workOrder.branch
                    ? `${workOrder.branch.code} · ${workOrder.branch.name}`
                    : '—',
                },
                {
                  label: t('fsm.workOrders.record.assignee'),
                  value: workOrder.assignee?.name ?? t('fsm.workOrders.record.unassigned'),
                },
                {
                  label: t('fsm.workOrders.record.scheduledAt'),
                  value: formatDateTimeMedium(workOrder.scheduledAt, locale),
                },
                {
                  label: t('fsm.workOrders.record.dueAt'),
                  value: (
                    <span className={workOrder.isOverdue ? 'text-destructive' : undefined}>
                      {formatDateTimeMedium(workOrder.dueAt, locale)}
                    </span>
                  ),
                },
                {
                  label: t('fsm.workOrders.record.createdBy'),
                  value: `${workOrder.createdBy} · ${formatDateTimeMedium(workOrder.createdAt, locale)}`,
                },
                ...(workOrder.startedAt
                  ? [
                      {
                        label: t('fsm.workOrders.record.startedAt'),
                        value: formatDateTimeMedium(workOrder.startedAt, locale),
                      },
                    ]
                  : []),
                ...(workOrder.completedAt
                  ? [
                      {
                        label: t('fsm.workOrders.record.completedAt'),
                        value: formatDateTimeMedium(workOrder.completedAt, locale),
                      },
                    ]
                  : []),
                ...(workOrder.description
                  ? [
                      {
                        label: t('fsm.workOrders.record.description'),
                        value: (
                          <span className="whitespace-pre-line font-normal">
                            {workOrder.description}
                          </span>
                        ),
                        className: 'sm:col-span-2',
                      },
                    ]
                  : []),
              ]}
            />
          </FormSection>
        </SectionBlock>

        <SectionBlock>
          <FormSection
            title={t('fsm.workOrders.record.execution')}
            description={t('fsm.workOrders.record.executionBody')}
          >
            <div className="grid gap-8">
              {workOrder.resolution || workOrder.holdReason || workOrder.cancellationReason ? (
                <DescriptionList
                  items={[
                    ...(workOrder.resolution
                      ? [
                          {
                            label: t('fsm.workOrders.record.resolution'),
                            value: (
                              <span
                                className="whitespace-pre-line font-normal"
                                data-testid="work-order-resolution"
                              >
                                {workOrder.resolution}
                              </span>
                            ),
                            className: 'sm:col-span-2',
                          },
                        ]
                      : []),
                    ...(workOrder.status === 'ON_HOLD' && workOrder.holdReason
                      ? [
                          {
                            label: t('fsm.workOrders.record.holdReason'),
                            value: workOrder.holdReason,
                            className: 'sm:col-span-2',
                          },
                        ]
                      : []),
                    ...(workOrder.cancellationReason
                      ? [
                          {
                            label: t('fsm.workOrders.record.cancellationReason'),
                            value: workOrder.cancellationReason,
                            className: 'sm:col-span-2',
                          },
                        ]
                      : []),
                  ]}
                />
              ) : null}

              <div className="grid gap-3" data-testid="work-order-items">
                <h3 className="text-base">{t('fsm.workOrders.record.items')}</h3>
                {workOrder.items.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border px-4 py-4 text-center text-sm text-text-3">
                    {t('fsm.workOrders.record.noItems')}
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-surface-2 text-left text-text-3">
                        <tr>
                          <th className="px-3 py-2 font-medium">
                            {t('fsm.workOrders.record.item')}
                          </th>
                          <th className="px-3 py-2 text-right font-medium">
                            {t('fsm.workOrders.record.quantity')}
                          </th>
                          <th className="px-3 py-2 text-right font-medium">
                            {t('fsm.workOrders.record.unitPrice')}
                          </th>
                          {canRecordItems ? <th className="w-12" /> : null}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {workOrder.items.map((item) => (
                          <tr key={item.id} data-testid={`work-order-item-${item.id}`}>
                            <td className="px-3 py-2">
                              {item.name}
                              <span className="ml-2 text-xs text-text-3">
                                {t(`fsm.catalogItems.kind.${item.kind}`)}
                              </span>
                            </td>
                            <td className="olv-data px-3 py-2 text-right tabular">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="olv-data px-3 py-2 text-right tabular">
                              {item.unitPrice ? formatCurrency(Number(item.unitPrice)) : '—'}
                            </td>
                            {canRecordItems ? (
                              <td className="px-1 py-1 text-right">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  disabled={isPending}
                                  aria-label={t('fsm.workOrders.record.removeItem', {
                                    name: item.name,
                                  })}
                                  onClick={() =>
                                    run(
                                      () => removeWorkOrderItemAction(workOrder.id, item.id),
                                      t('fsm.workOrders.record.itemRemoved'),
                                    )
                                  }
                                >
                                  <Trash2 aria-hidden="true" />
                                </Button>
                              </td>
                            ) : null}
                          </tr>
                        ))}
                      </tbody>
                      {totalItems > 0 ? (
                        <tfoot className="border-t border-border bg-surface-2">
                          <tr>
                            <td className="px-3 py-2 font-medium" colSpan={2}>
                              {t('fsm.workOrders.record.total')}
                            </td>
                            <td className="olv-data px-3 py-2 text-right font-medium tabular">
                              {formatCurrency(totalItems)}
                            </td>
                            {canRecordItems ? <td /> : null}
                          </tr>
                        </tfoot>
                      ) : null}
                    </table>
                  </div>
                )}

                {canRecordItems ? (
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem_auto] sm:items-end">
                    <div className="grid gap-1.5">
                      <Label htmlFor="work-order-item-picker">
                        {t('fsm.workOrders.record.item')}
                      </Label>
                      <AsyncCombobox
                        id="work-order-item-picker"
                        value={itemChoice?.id ?? null}
                        selectedLabel={itemChoice?.label ?? null}
                        loadOptions={async (search) =>
                          (await searchCatalogItemsAction(search)).map((item) => ({
                            value: item.id,
                            label: `${item.name} (${item.unit})`,
                            description: item.code,
                          }))
                        }
                        onChange={(value, option) =>
                          setItemChoice({ id: value, label: option.label })
                        }
                        placeholder={t('fsm.workOrders.record.itemPlaceholder')}
                        emptyText={t('fsm.workOrders.record.itemEmpty')}
                        data-testid="work-order-item-picker"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="work-order-item-quantity">
                        {t('fsm.workOrders.record.quantity')}
                      </Label>
                      <Input
                        id="work-order-item-quantity"
                        inputMode="decimal"
                        value={quantity}
                        onChange={(event) => setQuantity(event.target.value.replace(',', '.'))}
                        className="tabular"
                        data-testid="work-order-item-quantity"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPending || !itemChoice}
                      onClick={() =>
                        itemChoice &&
                        run(async () => {
                          const result = await addWorkOrderItemAction(workOrder.id, {
                            catalogItemId: itemChoice.id,
                            quantity,
                          });

                          if (result.success) {
                            setItemChoice(null);
                            setQuantity('1');
                          }

                          return result;
                        }, t('fsm.workOrders.record.itemAdded'))
                      }
                      data-testid="work-order-item-add"
                    >
                      {t('fsm.workOrders.record.addItem')}
                    </Button>
                  </div>
                ) : !isFinal ? (
                  <p className="text-sm text-text-3">{t('fsm.workOrders.record.itemsLocked')}</p>
                ) : null}
              </div>

              {canNote ? (
                <div className="grid gap-2" data-testid="work-order-notes">
                  <Label htmlFor="work-order-note">{t('fsm.workOrders.record.notes')}</Label>
                  <Textarea
                    id="work-order-note"
                    rows={3}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder={t('fsm.workOrders.record.notePlaceholder')}
                    data-testid="work-order-note-input"
                  />
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending || note.trim() === ''}
                      onClick={() =>
                        run(async () => {
                          const result = await addWorkOrderNoteAction(workOrder.id, note);

                          if (result.success) {
                            setNote('');
                          }

                          return result;
                        }, t('fsm.workOrders.record.noteAdded'))
                      }
                      data-testid="work-order-note-add"
                    >
                      <MessageSquare aria-hidden="true" />
                      {t('fsm.workOrders.record.addNote')}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </FormSection>
        </SectionBlock>

        <SectionBlock>
          <FormSection
            title={t('fsm.workOrders.record.history')}
            description={t('fsm.workOrders.record.historyBody')}
          >
            <div data-testid="work-order-history">
              <Timeline
                items={workOrder.events.map((event) => ({
                  id: event.id,
                  title: eventTitle(event, t),
                  ...(event.type === 'ASSIGNED' || !event.message
                    ? {}
                    : { description: event.message }),
                  timestamp: `${event.actorName} · ${formatDateTimeMedium(event.createdAt, locale)}`,
                  icon: EVENT_ICON[event.type],
                }))}
              />
            </div>
          </FormSection>
        </SectionBlock>
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
                  {t(
                    dialog === 'ON_HOLD'
                      ? 'fsm.workOrders.actions.hold_.title'
                      : dialog === 'CANCELLED'
                        ? 'fsm.workOrders.actions.cancel_.title'
                        : 'fsm.workOrders.actions.complete_.title',
                  )}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t(
                    dialog === 'ON_HOLD'
                      ? 'fsm.workOrders.actions.hold_.body'
                      : dialog === 'CANCELLED'
                        ? 'fsm.workOrders.actions.cancel_.body'
                        : 'fsm.workOrders.actions.complete_.body',
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
                  <span className="ml-0.5 text-destructive" aria-hidden="true">
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
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel variant="ghost" data-testid="work-order-status-cancel">
                  {t('fsm.workOrders.actions.keep')}
                </AlertDialogCancel>
                <AlertDialogAction
                  variant={dialog === 'CANCELLED' ? 'destructive' : 'default'}
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
