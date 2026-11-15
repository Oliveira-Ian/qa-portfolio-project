import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

/**
 * The design's button (handoff § 4, board 04). Sizes: sm 32, md 36 (default),
 * lg 44 — the touch size, used on auth and mobile. One primary per region,
 * rightmost; Cancel is `ghost`; a filled `destructive` only inside a
 * confirmation, everywhere else `destructive-soft`.
 *
 * The variant names keep shadcn's so call sites didn't change: `outline` is the
 * design's "secondary", `default` its "primary".
 *
 * Focus is `focus-visible`, never `focus`: a 2px gap in the surface colour and a
 * 2px ring, for the keyboard only. A disabled primary is tinted in the product
 * accent, not grey.
 */
const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center rounded-md border border-transparent text-sm font-medium tracking-[-0.005em] whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-100 outline-none select-none focus-visible:ring-focus active:translate-y-px disabled:pointer-events-none disabled:translate-y-0 aria-disabled:pointer-events-none aria-busy:cursor-progress [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.14),0_1px_2px_rgba(18,21,27,.2)] hover:bg-primary-hover active:bg-primary-active active:shadow-[inset_0_1px_3px_rgba(0,0,0,.28)] disabled:bg-primary-disabled-bg disabled:text-primary-disabled-fg disabled:shadow-none aria-disabled:bg-primary-disabled-bg aria-disabled:text-primary-disabled-fg aria-disabled:shadow-none',
        outline:
          'border-border-button bg-surface text-foreground shadow-xs hover:border-border-button-hover hover:bg-surface-2 active:bg-subtle active:shadow-[inset_0_1px_2px_rgba(18,21,27,.1)] aria-expanded:bg-surface-2 disabled:border-border disabled:bg-surface-2 disabled:text-text-disabled disabled:shadow-none',
        secondary:
          'bg-subtle text-foreground hover:bg-divider active:bg-border disabled:text-text-disabled',
        ghost:
          'text-text-2 hover:bg-foreground/5 hover:text-foreground active:bg-foreground/10 aria-expanded:bg-foreground/5 aria-expanded:text-foreground disabled:text-text-disabled',
        destructive:
          'bg-destructive text-destructive-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_1px_2px_rgba(18,21,27,.2)] hover:bg-destructive-hover active:bg-[var(--olv-danger-800)] active:shadow-[inset_0_1px_3px_rgba(0,0,0,.28)] disabled:bg-danger-border/60 disabled:text-danger-on/60 disabled:shadow-none',
        'destructive-soft':
          'border-danger-border bg-surface text-destructive shadow-xs hover:border-destructive/50 hover:bg-danger-light active:bg-danger-light disabled:border-danger-border/50 disabled:text-destructive/40 disabled:shadow-none',
        link: 'h-auto rounded-xs px-0 py-0.5 font-semibold text-primary underline decoration-transparent decoration-[1.5px] underline-offset-3 shadow-none hover:decoration-current active:translate-y-0 active:text-primary-active disabled:text-text-disabled disabled:no-underline',
        shell:
          'border-shell-border bg-shell-control text-shell-text hover:border-[#363C48] hover:bg-shell-control-hover hover:text-white focus-visible:ring-focus-shell',
      },
      size: {
        default: 'h-9 gap-2 px-3.5 max-md:h-11',
        xs: 'h-7 gap-1 rounded-sm px-2 text-xs [&_svg:not([class*=size-])]:size-3',
        sm: 'h-8 gap-1.5 px-2.5 text-[13px] max-md:h-10',
        lg: 'h-11 gap-2 px-[18px] text-[15px] font-semibold',
        icon: 'size-9 max-md:size-11',
        'icon-xs': 'size-7 rounded-sm [&_svg:not([class*=size-])]:size-3',
        'icon-sm': 'size-8 max-md:size-10',
        'icon-lg': 'size-11',
      },
    },
    // A link button is inline text: whatever the size asks for, it has no fixed height or padding.
    compoundVariants: [{ variant: 'link', className: 'h-auto px-0 py-0.5' }],
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
  loading = false,
  children,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /**
     * Loading (handoff § 4): the label is hidden but keeps its space, so the
     * button doesn't change width; a spinner sits centred and `aria-busy` says so.
     * The button stays focusable — the caller ignores a second press while busy.
     */
    loading?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';
  const isLoading = loading && !asChild;

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      aria-busy={isLoading || undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="invisible inline-flex items-center gap-[inherit]">{children}</span>
          <Loader2 className="absolute animate-spin" aria-hidden="true" />
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
