'use client';

import * as React from 'react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';
import { CheckIcon, MinusIcon } from 'lucide-react';

/**
 * 18px, a 1.5px control border, the product accent when checked, the design's
 * focus ring. `checked` also accepts `'indeterminate'` (Radix's own type) — a
 * "select all" control passes it through when only some, not all, rows are
 * selected, so the box (and a screen reader via `aria-checked="mixed"`, which
 * Radix sets automatically) can tell "some" from "none".
 */
function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer relative flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] border-input bg-surface transition-colors duration-100 outline-none after:absolute after:-inset-x-3 after:-inset-y-2 hover:border-input-hover focus-visible:ring-focus disabled:cursor-not-allowed disabled:border-border disabled:bg-background aria-invalid:border-destructive',
        'data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:hover:border-primary-hover data-[state=checked]:disabled:border-primary-disabled-bg data-[state=checked]:disabled:bg-primary-disabled-bg',
        'data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5 [&>svg]:stroke-[3]"
      >
        {props.checked === 'indeterminate' ? <MinusIcon /> : <CheckIcon />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
