import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

/**
 * Sizes are a step larger than the shadcn preset. This is a back-office people
 * spend hours in, and the stock 32px control is below a comfortable pointer
 * target — `docs/design/components/buttons.md` asks for an appropriate one.
 *
 * Focus is `focus-visible`, never `focus`, so a ring appears for the keyboard
 * and not on every click.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow] outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-button hover:bg-primary-hover',
        outline:
          'border-border bg-card text-foreground hover:border-border-hover hover:bg-muted aria-expanded:bg-muted',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-border',
        ghost: 'hover:bg-muted hover:text-foreground aria-expanded:bg-muted',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:border-destructive focus-visible:ring-destructive/30',
        link: 'text-primary underline underline-offset-4 hover:text-primary-hover',
      },
      size: {
        default: 'h-10 gap-2 px-4',
        xs: 'h-7 gap-1 rounded-sm px-2 text-xs [&_svg:not([class*=size-])]:size-3',
        sm: 'h-9 gap-1.5 px-3 text-[0.8125rem]',
        lg: 'h-11 gap-2 px-5',
        icon: 'size-10',
        'icon-xs': 'size-7 rounded-sm [&_svg:not([class*=size-])]:size-3',
        'icon-sm': 'size-9',
        'icon-lg': 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
