'use client';

import { useState } from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import type { WorkOrderDto, WorkOrderItemDto } from '@oliveira/schemas';
import { FsmCard } from '@/components/fsm/record-layout';
import { Avatar } from '@/components/fsm/person-chip';
import { AsyncCombobox } from '@/components/ui/async-combobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatDuration, formatShortDateTime, formatSpan } from '@/lib/fsm-format';
import { useLocale, useT } from '@/lib/i18n/provider';
import { cn } from '@/lib/utils';
import { searchCatalogItemsAction } from '../_actions/work-order-actions';
import { WorkOrderItemsTable } from './work-order-items-table';

interface WorkOrderExecutionProps {
  workOrder: WorkOrderDto;
  now: string;
  canRecordItems: boolean;
  canNote: boolean;
  isPending: boolean;
  onAddItem: (catalogItemId: string, quantity: string) => Promise<boolean>;
  onRemoveItem: (item: WorkOrderItemDto) => void;
  onAddNote: (message: string) => Promise<boolean>;
}

/**
 * The Execution tab (board FSM-05b): the times the status changes recorded,
 * the materials and services (added while In progress or On hold), the notes,
 * and the outcome the status changes asked for.
 */
export function WorkOrderExecution({
  workOrder,
  now,
  canRecordItems,
  canNote,
  isPending,
  onAddItem,
  onRemoveItem,
  onAddNote,
}: WorkOrderExecutionProps) {
  const t = useT();
  const locale = useLocale();
  const [itemChoice, setItemChoice] = useState<{ id: string; label: string } | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  const notes = workOrder.events.filter((event) => event.type === 'NOTE');
  const elapsedUntil = workOrder.completedAt ?? workOrder.cancelledAt ?? now;

  const logTiles = [
    {
      label: t('fsmUi.workOrder.execution.started'),
      value: workOrder.startedAt ? formatShortDateTime(workOrder.startedAt, locale) : '—',
      hint:
        workOrder.startedAt && workOrder.assignee
          ? t('fsmUi.workOrder.execution.byName', { name: workOrder.assignee.name })
          : t('fsmUi.workOrder.lifecycle.notYet'),
    },
    {
      label: t('fsmUi.workOrder.execution.elapsed'),
      value: workOrder.startedAt
        ? formatSpan(new Date(elapsedUntil).getTime() - new Date(workOrder.startedAt).getTime(), t)
        : '—',
      hint: '',
    },
    {
      label: t('fsmUi.workOrder.execution.estimated'),
      value: formatDuration(workOrder.estimatedMinutes, t),
      hint: workOrder.estimatedMinutes ? t('fsmUi.workOrder.execution.fromType') : '',
    },
    {
      label: t('fsmUi.workOrder.execution.completed'),
      value: workOrder.completedAt ? formatShortDateTime(workOrder.completedAt, locale) : '—',
      hint: workOrder.completedAt ? '' : t('fsmUi.workOrder.lifecycle.needsResolution'),
    },
  ];

  const outcome = [
    {
      label: t('fsm.workOrders.record.resolution'),
      value: workOrder.resolution,
      empty: t('fsmUi.workOrder.execution.askedOnComplete'),
      testId: 'work-order-resolution',
    },
    {
      label: t('fsm.workOrders.record.holdReason'),
      value: workOrder.holdReason,
      empty: t('fsmUi.workOrder.execution.askedOnHold'),
    },
    {
      label: t('fsm.workOrders.record.cancellationReason'),
      value: workOrder.cancellationReason,
      empty: t('fsmUi.workOrder.execution.askedOnCancel'),
    },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <FsmCard
        title={t('fsmUi.workOrder.execution.workLog')}
        description={t('fsmUi.workOrder.execution.workLogBody')}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {logTiles.map((tile) => (
            <div
              key={tile.label}
              className="flex min-w-0 flex-col gap-1 rounded-[10px] border border-divider bg-surface-2 px-3.5 py-3"
            >
              <span className="text-[12.5px] text-text-3">{tile.label}</span>
              <span className="truncate text-[15px] font-semibold tabular-nums">{tile.value}</span>
              {tile.hint ? (
                <span className="truncate text-[12px] text-text-3">{tile.hint}</span>
              ) : null}
            </div>
          ))}
        </div>
      </FsmCard>

      <FsmCard
        title={t('fsmUi.workOrder.materials.title')}
        description={t(
          canRecordItems
            ? 'fsmUi.workOrder.materials.allowedWhen'
            : 'fsmUi.workOrder.materials.lockedWhen',
          { count: workOrder.items.length },
        )}
      >
        <div className="flex flex-col gap-4">
          <WorkOrderItemsTable
            items={workOrder.items}
            disabled={isPending}
            {...(canRecordItems ? { onRemove: onRemoveItem } : {})}
          />

          {canRecordItems ? (
            <div className="grid gap-3 rounded-[10px] border border-dashed border-border-button p-3.5 sm:grid-cols-[minmax(0,1fr)_7rem_auto] sm:items-end">
              <div className="grid min-w-0 gap-1.5">
                <Label htmlFor="work-order-item-picker">
                  {t('fsmUi.workOrder.materials.addFromCatalog')}
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
                  onChange={(value, option) => setItemChoice({ id: value, label: option.label })}
                  placeholder={t('fsmUi.workOrder.materials.searchCatalog')}
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
                  className="tabular-nums"
                  data-testid="work-order-item-quantity"
                />
              </div>
              <Button
                type="button"
                variant="confirm"
                disabled={isPending || !itemChoice}
                onClick={async () => {
                  if (itemChoice && (await onAddItem(itemChoice.id, quantity))) {
                    setItemChoice(null);
                    setQuantity('1');
                  }
                }}
                data-testid="work-order-item-add"
              >
                <Plus aria-hidden="true" />
                {t('fsm.workOrders.record.addItem')}
              </Button>
            </div>
          ) : null}
        </div>
      </FsmCard>

      <FsmCard
        title={t('fsm.workOrders.record.notes')}
        description={t('fsmUi.workOrder.execution.notesBody')}
        testId="work-order-notes"
      >
        <div className="flex flex-col gap-4">
          {canNote ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="work-order-note" className="sr-only">
                {t('fsm.workOrders.record.notes')}
              </Label>
              <Textarea
                id="work-order-note"
                rows={3}
                maxLength={2000}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={t('fsm.workOrders.record.notePlaceholder')}
                data-testid="work-order-note-input"
              />
              <div className="flex items-center justify-between gap-3">
                <span className="text-[12px] text-text-3 tabular-nums">
                  {note.length.toLocaleString(locale)} / {(2000).toLocaleString(locale)}
                </span>
                <Button
                  type="button"
                  variant="confirm"
                  size="sm"
                  disabled={isPending || note.trim() === ''}
                  onClick={async () => {
                    if (await onAddNote(note)) {
                      setNote('');
                    }
                  }}
                  data-testid="work-order-note-add"
                >
                  <MessageSquare aria-hidden="true" />
                  {t('fsm.workOrders.record.addNote')}
                </Button>
              </div>
            </div>
          ) : null}
          {notes.length === 0 ? (
            <p className="m-0 rounded-[10px] border border-dashed border-border-button px-4 py-4 text-center text-[13.5px] text-text-3">
              {t('fsmUi.workOrder.execution.noNotes')}
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col divide-y divide-divider p-0">
              {notes.map((event) => (
                <li key={event.id} className="flex gap-3 py-3 first:pt-0">
                  <Avatar name={event.actorName} />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[12.5px] text-text-3">
                      <b className="font-semibold text-foreground">{event.actorName}</b> ·{' '}
                      {formatShortDateTime(event.createdAt, locale)}
                    </span>
                    <p className="m-0 text-sm whitespace-pre-line">{event.message}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </FsmCard>

      <FsmCard
        title={t('fsmUi.workOrder.execution.outcome')}
        description={t('fsmUi.workOrder.execution.outcomeBody')}
      >
        <dl className="m-0 grid gap-4">
          {outcome.map((row) => (
            <div key={row.label} className="grid gap-1 sm:grid-cols-[180px_minmax(0,1fr)]">
              <dt className="text-[13px] font-medium text-text-2">{row.label}</dt>
              <dd
                data-testid={row.value ? row.testId : undefined}
                className={cn(
                  'm-0 border-b border-border pb-2 text-[14.5px] whitespace-pre-line',
                  row.value ? 'font-medium text-foreground' : 'text-text-muted',
                )}
              >
                {row.value ?? `— ${row.empty}`}
              </dd>
            </div>
          ))}
        </dl>
      </FsmCard>
    </div>
  );
}
