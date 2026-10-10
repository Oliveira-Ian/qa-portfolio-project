'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCount } from '@/lib/format';
import { useT } from '@/lib/i18n/provider';
import { cn } from '@/lib/utils';

const DEFAULT_PAGE_SIZES = [10, 25, 50];

interface ListPaginationProps {
  /** 1-based. */
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  testIdPrefix: string;
  className?: string;
}

/** The page numbers to show: the first, the last and a window around the current, with gaps as `null`. */
function pageWindow(page: number, pageCount: number): (number | null)[] {
  const wanted = new Set([1, pageCount, page - 1, page, page + 1]);
  const pages = [...wanted]
    .filter((value) => value >= 1 && value <= pageCount)
    .sort((a, b) => a - b);
  const items: (number | null)[] = [];

  for (const value of pages) {
    const previous = items.at(-1);

    if (typeof previous === 'number' && value - previous > 1) {
      items.push(null);
    }

    items.push(value);
  }

  return items;
}

/**
 * Pagination for a list the page already holds in full (the company's members,
 * which the API returns in one piece) — summary · rows per page · previous /
 * numbers / next, with the current page tinted in the accent (handoff § 4). It
 * is the client-side sibling of `data-table/pagination.tsx`, which is bound to a
 * TanStack table and a URL query. A single page shows no ellipsis and a disabled
 * next.
 */
export function ListPagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  testIdPrefix,
  className,
}: ListPaginationProps) {
  const t = useT();
  const pageCount = Math.max(Math.ceil(total / pageSize), 1);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <nav
      aria-label={t('pagination.navLabel')}
      data-testid={`${testIdPrefix}-pagination`}
      className={cn('flex flex-wrap items-center justify-between gap-3 py-4', className)}
    >
      <p className="olv-data text-text-3" data-testid={`${testIdPrefix}-pagination-range`}>
        {total === 0
          ? t('pagination.empty')
          : t('pagination.summary', {
              from: formatCount(from),
              to: formatCount(to),
              total: formatCount(total),
            })}
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-text-3">{t('pagination.rowsPerPage')}</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger
              size="sm"
              className="olv-data w-[4.5rem]"
              data-testid={`${testIdPrefix}-pagination-page-size`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label={t('pagination.previous')}
            data-testid={`${testIdPrefix}-pagination-prev`}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>

          {pageWindow(page, pageCount).map((item, index) =>
            item === null ? (
              <span key={`gap-${index}`} aria-hidden="true" className="px-1 text-text-3">
                …
              </span>
            ) : (
              <Button
                key={item}
                variant="ghost"
                size="icon-sm"
                onClick={() => onPageChange(item)}
                aria-label={t('pagination.page', { page: item })}
                aria-current={item === page ? 'page' : undefined}
                className={cn(
                  'olv-data',
                  item === page && 'bg-accent-50 font-semibold text-accent-600 hover:bg-accent-50',
                )}
              >
                {item}
              </Button>
            ),
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
            aria-label={t('pagination.next')}
            data-testid={`${testIdPrefix}-pagination-next`}
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
