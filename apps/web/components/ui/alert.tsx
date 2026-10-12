import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { CircleCheckIcon, InfoIcon, OctagonXIcon, TriangleAlertIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * The Alert is a message **inside the page**, a form or a panel, that stays
 * while the situation lasts (handoff § 4a). It is not the Toast: the Toast is
 * temporary and floats outside the layout.
 *
 * A tinted fill with a tone border, the tone's icon, a title and optionally a
 * description and one action. Errors are `role="alert"` (announced at once);
 * everything else `role="status"` (announced politely). Tones are the same four
 * the Toast uses, and only those — no product-coloured alerts, and carmine is
 * never one of them.
 */
const alertVariants = cva(
  'group/alert relative grid w-full gap-0.5 rounded-lg border px-4 py-3 text-left text-sm has-data-[slot=alert-action]:pr-28 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-3 *:[svg]:row-span-2 *:[svg]:mt-0.5 *:[svg:not([class*="size-"])]:size-4',
  {
    variants: {
      variant: {
        default: 'border-border bg-card text-card-foreground *:[svg]:text-text-3',
        destructive: 'border-danger-border bg-danger-light text-danger-on *:[svg]:text-danger',
        success: 'border-success-border bg-success-light text-success-on *:[svg]:text-success',
        warning: 'border-warning-border bg-warning-light text-warning-on *:[svg]:text-warning',
        info: 'border-info-border bg-info-light text-info-on *:[svg]:text-info',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

type AlertVariant = NonNullable<VariantProps<typeof alertVariants>['variant']>;

const ALERT_ICONS: Record<Exclude<AlertVariant, 'default'>, React.ElementType> = {
  destructive: OctagonXIcon,
  success: CircleCheckIcon,
  warning: TriangleAlertIcon,
  info: InfoIcon,
};

function Alert({
  className,
  variant,
  children,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  const Icon = variant && variant !== 'default' ? ALERT_ICONS[variant] : null;

  return (
    <div
      data-slot="alert"
      role={variant === 'destructive' ? 'alert' : 'status'}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {Icon ? <Icon aria-hidden="true" /> : null}
      {children}
    </div>
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        'font-semibold group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3',
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'text-[13px] leading-[1.5] text-pretty opacity-90 group-has-[>svg]/alert:col-start-2 [&_a]:font-semibold [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-3',
        className,
      )}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-action"
      className={cn('absolute top-2.5 right-3 flex items-center gap-2', className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertAction };
