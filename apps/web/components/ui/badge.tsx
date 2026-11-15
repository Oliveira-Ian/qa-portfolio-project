import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

/**
 * The design has three small marks that must never be mistaken for each other
 * (handoff § 4):
 *
 * - `Badge` — a **tag**: a category. Archivo, sentence case, pill, 24px. Role
 *   Admin / Member, person type, a removable filter.
 * - `StatusBadge` — a **state**: mono, uppercase, a dot and text, radius 4.
 * - `AccessBadge` — the Platform's own answer to "can this member open the
 *   product", in `components/platform/`.
 *
 * Colour is never the only carrier: every one has text, and most an icon.
 */
const badgeVariants = cva(
  'group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-transparent px-2.5 text-[12.5px] font-medium whitespace-nowrap transition-colors focus-visible:ring-focus aria-invalid:border-destructive has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-2 [&>svg]:pointer-events-none [&>svg]:size-3.5!',
  {
    variants: {
      variant: {
        default: 'bg-[#f1eee8] text-text-2 shadow-[inset_0_0_0_1px_rgba(18,21,27,.07)]',
        secondary: 'bg-subtle text-text-2 shadow-[inset_0_0_0_1px_rgba(18,21,27,.07)]',
        /** A filter or a chip the reader can remove. */
        outline:
          'border-border-button bg-surface text-text-2 [a]:hover:bg-surface-2 [button]:hover:bg-surface-2',
        /** The company administrator — navy tint, in every product. */
        admin: 'bg-[#e9ecf3] text-[#1e2c47] shadow-[inset_0_0_0_1px_rgba(30,44,71,.16)]',
        destructive: 'bg-danger-light text-danger-on',
        ghost: 'hover:bg-foreground/5',
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
          className="-mr-0.5 ml-0.5 grid size-5 place-items-center rounded-full transition-colors hover:bg-current/10 focus-visible:ring-focus"
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

const statusBadgeVariants = cva(
  'inline-flex h-[22px] w-fit shrink-0 items-center gap-1.5 rounded-xs px-2 font-mono text-[11px] font-medium tracking-[0.08em] whitespace-nowrap uppercase',
  {
    variants: {
      tone: {
        success: 'bg-success-light text-success-on',
        warning: 'bg-warning-light text-warning-on',
        danger: 'bg-danger-light text-danger-on',
        info: 'bg-info-light text-info-on',
        neutral: 'bg-neutral-light text-neutral-on',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

/** A state (active, inactive, pending…) — a dot and text, never colour alone. */
function StatusBadge({
  className,
  tone,
  children,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof statusBadgeVariants>) {
  return (
    <span
      data-slot="status-badge"
      className={cn(statusBadgeVariants({ tone }), className)}
      {...props}
    >
      <i aria-hidden="true" className="size-1.5 rounded-full bg-current opacity-90" />
      {children}
    </span>
  );
}

export { Badge, badgeVariants, StatusBadge, statusBadgeVariants };
