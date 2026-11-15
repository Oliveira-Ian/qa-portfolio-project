'use client';

import { Trash2 } from 'lucide-react';
import type { WorkOrderItemDto } from '@oliveira/schemas';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import { formatShortDateTime } from '@/lib/fsm-format';
import { useLocale, useT } from '@/lib/i18n/provider';

const COLUMNS = 'grid-cols-[minmax(0,1fr)_84px_110px_110px_36px]';

/**
 * Materials and services on a work order (board FSM-05b): what was used, how
 * much, the catalog price at that moment and the total by kind. Removing a
 * line is offered only while items may be recorded.
 */
export function WorkOrderItemsTable({
  items,
  onRemove,
  disabled = false,
}: {
  items: WorkOrderItemDto[];
  onRemove?: (item: WorkOrderItemDto) => void;
  disabled?: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const lineTotal = (item: WorkOrderItemDto) =>
    item.unitPrice ? Number(item.unitPrice) * Number(item.quantity) : 0;
  const services = items
    .filter((item) => item.kind === 'SERVICE')
    .reduce((sum, item) => sum + lineTotal(item), 0);
  const products = items
    .filter((item) => item.kind === 'PRODUCT')
    .reduce((sum, item) => sum + lineTotal(item), 0);

  if (items.length === 0) {
    return (
      <p className="rounded-[10px] border border-dashed border-border-button px-4 py-5 text-center text-[13.5px] text-text-3">
        {t('fsm.workOrders.record.noItems')}
      </p>
    );
  }

  return (
    <div
      role="table"
      className="overflow-hidden rounded-xl border border-border"
      data-testid="work-order-items"
    >
      <div
        role="row"
        className={`grid ${COLUMNS} items-center gap-4 border-b border-border bg-surface-2 px-4 py-2.5 text-[12px] font-semibold text-text-3`}
      >
        <span role="columnheader">{t('fsm.workOrders.record.item')}</span>
        <span role="columnheader" className="text-right">
          {t('fsm.workOrders.record.quantity')}
        </span>
        <span role="columnheader" className="text-right">
          {t('fsm.workOrders.record.unitPrice')}
        </span>
        <span role="columnheader" className="text-right">
          {t('fsm.workOrders.record.total')}
        </span>
        <span role="columnheader" />
      </div>
      {items.map((item) => (
        <div
          role="row"
          key={item.id}
          data-testid={`work-order-item-${item.id}`}
          className={`grid ${COLUMNS} min-h-14 items-center gap-4 border-b border-divider px-4 py-2 text-sm`}
        >
          <span role="cell" className="flex min-w-0 flex-col gap-0.5">
            <span className="flex items-center gap-2 font-semibold">
              <span className="truncate">{item.name}</span>
              <span className="inline-flex h-[22px] shrink-0 items-center rounded-[7px] bg-subtle px-2 text-[12px] font-medium text-text-2">
                {t(`fsm.catalogItems.kind.${item.kind}`)}
              </span>
            </span>
            <span className="truncate text-[12.5px] text-text-3">
              {t('fsmUi.workOrder.materials.addedBy', {
                date: formatShortDateTime(item.createdAt, locale),
              })}
            </span>
          </span>
          <span role="cell" className="text-right tabular-nums">
            {item.quantity} {item.unit}
          </span>
          <span role="cell" className="text-right tabular-nums">
            {item.unitPrice ? formatCurrency(Number(item.unitPrice)) : '—'}
          </span>
          <span role="cell" className="text-right font-semibold tabular-nums">
            {item.unitPrice ? formatCurrency(lineTotal(item)) : '—'}
          </span>
          <span role="cell" className="flex justify-end">
            {onRemove ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={disabled}
                aria-label={t('fsm.workOrders.record.removeItem', { name: item.name })}
                onClick={() => onRemove(item)}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            ) : null}
          </span>
        </div>
      ))}
      <div
        role="row"
        className="flex min-h-12 items-center justify-between gap-4 bg-surface-2 px-4 text-[13px] text-text-3"
      >
        <span role="cell" className="flex gap-4">
          <span>
            {t('fsmUi.workOrder.materials.services')}{' '}
            <b className="font-semibold text-foreground tabular-nums">{formatCurrency(services)}</b>
          </span>
          <span>
            {t('fsmUi.workOrder.materials.products')}{' '}
            <b className="font-semibold text-foreground tabular-nums">{formatCurrency(products)}</b>
          </span>
        </span>
        <span role="cell" className="text-sm font-bold text-foreground tabular-nums">
          {formatCurrency(services + products)}
        </span>
      </div>
    </div>
  );
}
