'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Below 768px a table is a list of cards (handoff § 6): each row becomes a card
 * and each cell a line, named by its `data-label` (a cell without one — the
 * member's name, the row's menu — just sits there). The header stays for screen
 * readers and is hidden from sight. It is opt-in because a few tables are
 * genuinely tabular at any width.
 */
const STACKED_CLASSES = [
  'max-md:block',
  'max-md:[&_thead]:sr-only',
  'max-md:[&_tbody]:block',
  'max-md:[&_tbody_tr]:relative max-md:[&_tbody_tr]:mb-3 max-md:[&_tbody_tr]:block max-md:[&_tbody_tr]:h-auto max-md:[&_tbody_tr]:rounded-xl max-md:[&_tbody_tr]:border max-md:[&_tbody_tr]:border-border max-md:[&_tbody_tr]:bg-surface max-md:[&_tbody_tr]:px-4 max-md:[&_tbody_tr]:py-2',
  'max-md:[&_tbody_td]:flex max-md:[&_tbody_td]:min-h-9 max-md:[&_tbody_td]:items-center max-md:[&_tbody_td]:justify-between max-md:[&_tbody_td]:gap-4 max-md:[&_tbody_td]:px-0 max-md:[&_tbody_td]:py-1.5 max-md:[&_tbody_td]:whitespace-normal',
  // The row's menu (a cell marked `data-card-corner`) rides in the card's top-right corner.
  'max-md:[&_tbody_td[data-card-corner]]:absolute max-md:[&_tbody_td[data-card-corner]]:top-2 max-md:[&_tbody_td[data-card-corner]]:right-2 max-md:[&_tbody_td[data-card-corner]]:min-h-0 max-md:[&_tbody_td[data-card-corner]]:p-0',
  'max-md:[&_tbody_td[data-label]]:before:shrink-0 max-md:[&_tbody_td[data-label]]:before:text-[13px] max-md:[&_tbody_td[data-label]]:before:text-text-3 max-md:[&_tbody_td[data-label]]:before:content-[attr(data-label)]',
].join(' ');

function Table({
  className,
  stacked = false,
  ...props
}: React.ComponentProps<'table'> & { stacked?: boolean }) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table
        data-slot="table"
        className={cn('w-full caption-bottom text-sm', stacked && STACKED_CLASSES, className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      data-slot="table-header"
      className={cn('bg-surface-2 [&_tr]:border-b [&_tr]:border-border', className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        'border-t border-border bg-surface-2 font-medium [&>tr]:last:border-b-0',
        className,
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'h-12 border-b border-divider transition-colors duration-100 hover:bg-surface-hover has-aria-expanded:bg-surface-hover data-[state=selected]:bg-accent-50 data-[state=selected]:hover:bg-accent-50',
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'h-10 px-3 text-left align-middle text-[13px] font-semibold whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0',
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'px-3 py-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0',
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('mt-4 text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
