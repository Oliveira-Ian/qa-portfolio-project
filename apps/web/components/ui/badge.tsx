import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a]:hover:bg-primary/80',
        secondary: 'bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80',
        destructive:
          'bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20',
        outline: 'border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground',
        ghost: 'hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({
  className,
  variant = 'default',
  asChild = false,
  onRemove,
  removeLabel = 'Remove',
  children,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
    /**
     * Renders a remove control merged inside the badge's own rounded edge —
     * `bg-current/10` tints the hover state from whatever text color the
     * active variant/tone already uses, so one class works across all of them
     * without a per-variant hover color.
     */
    onRemove?: () => void;
    removeLabel?: string;
  }) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), onRemove && 'pr-1', className)}
      {...props}
    >
      {children}
      {onRemove ? (
        <button
          type="button"
          aria-label={removeLabel}
          className="-mr-0.5 ml-0.5 rounded-full p-0.5 transition-colors hover:bg-current/10"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <X className="size-3" aria-hidden="true" />
        </button>
      ) : null}
    </Comp>
  );
}

export { Badge, badgeVariants };
