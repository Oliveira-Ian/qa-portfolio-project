'use client';

import Link from 'next/link';
import { ClipboardList, Plus } from 'lucide-react';
import { formatWorkOrderNumber, type WorkOrderListItemDto } from '@oliveira/schemas';
import { Button } from '@/components/ui/button';
import { formatDateTimeMedium } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import { OverdueBadge, WorkOrderStatusBadge } from './work-order-badges';

interface WorkOrderSummaryListProps {
  workOrders: WorkOrderListItemDto[];
  emptyText: string;
  /** "New work order" for this customer — when the caller may open one. */
  newHref?: string;
  testId: string;
}

/**
 * The work orders of one customer or one piece of equipment, newest first —
 * its service history, on its own sheet. Each opens the work order.
 */
export function WorkOrderSummaryList({
  workOrders,
  emptyText,
  newHref,
  testId,
}: WorkOrderSummaryListProps) {
  const t = useT();
  const locale = useLocale();

  return (
    <div className="grid gap-3" data-testid={testId}>
      {workOrders.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-4 py-5 text-center text-sm text-text-3">
          {emptyText}
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {workOrders.map((workOrder) => (
            <li key={workOrder.id}>
              <Link
                href={ROUTES.fsm.workOrders.view(workOrder.id)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2 focus-visible:ring-focus"
              >
                <ClipboardList className="size-4 shrink-0 text-text-3" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    <span className="olv-data mr-2 text-text-3">
                      {formatWorkOrderNumber(workOrder.number)}
                    </span>
                    {workOrder.title}
                  </span>
                  <span className="block truncate text-xs text-text-3">
                    {[
                      workOrder.type.name,
                      workOrder.assignee?.name,
                      workOrder.completedAt
                        ? formatDateTimeMedium(workOrder.completedAt, locale)
                        : workOrder.scheduledAt
                          ? formatDateTimeMedium(workOrder.scheduledAt, locale)
                          : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
                {workOrder.isOverdue ? <OverdueBadge /> : null}
                <WorkOrderStatusBadge status={workOrder.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {newHref ? (
        <div>
          <Button asChild variant="outline" size="sm" data-testid={`${testId}-new`}>
            <Link href={newHref}>
              <Plus aria-hidden="true" />
              {t('fsm.workOrders.list.add')}
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
