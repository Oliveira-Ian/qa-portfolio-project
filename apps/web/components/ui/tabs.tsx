'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Tabs as TabsPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';

/**
 * The design's tabs are one style: an underline in the product accent, with an
 * optional count pill (`TabsCount`). They scroll horizontally on narrow screens
 * and never wrap. `variant` is kept so existing call sites still type-check, but
 * both values render the same underline.
 */
function Tabs({
  className,
  orientation = 'horizontal',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn('group/tabs flex gap-2 data-horizontal:flex-col', className)}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  'group/tabs-list flex w-full items-center gap-0.5 overflow-x-auto border-b border-border [scrollbar-width:none] group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col [&::-webkit-scrollbar]:hidden',
  {
    variants: {
      variant: {
        default: '',
        line: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function TabsList({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "group/tab relative -mb-px inline-flex h-[42px] shrink-0 items-center gap-2 border-0 bg-transparent px-3 text-sm font-medium whitespace-nowrap text-text-3 transition-colors duration-100 outline-none hover:text-foreground disabled:pointer-events-none disabled:text-text-disabled aria-disabled:text-text-disabled data-[state=active]:font-semibold data-[state=active]:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // The hover/focus plate sits inside the tab, the indicator on its bottom edge.
        'before:absolute before:inset-x-0.5 before:inset-y-[5px] before:rounded-md before:bg-transparent before:transition-colors hover:before:bg-foreground/5 focus-visible:before:ring-2 focus-visible:before:ring-ring',
        'after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-t-sm after:bg-transparent after:transition-colors data-[state=active]:after:bg-primary',
        '*:relative *:z-10',
        className,
      )}
      {...props}
    />
  );
}

/** The number beside a tab's label — mono, in a pill that takes the accent tint when the tab is active. */
function TabsCount({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="tabs-count"
      className={cn(
        'rounded-full bg-subtle px-[7px] py-0.5 font-mono text-[11px] font-medium text-text-3 group-data-[state=active]/tab:bg-primary-light group-data-[state=active]/tab:text-primary',
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 text-sm outline-none', className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, TabsCount, tabsListVariants };
