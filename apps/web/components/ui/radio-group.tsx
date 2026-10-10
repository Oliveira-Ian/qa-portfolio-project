'use client';

import * as React from 'react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn('grid w-full gap-2', className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        'group/radio-group-item peer relative flex aspect-square size-[18px] shrink-0 rounded-full border-[1.5px] border-input bg-surface outline-none after:absolute after:-inset-x-3 after:-inset-y-2 hover:border-input-hover focus-visible:ring-focus disabled:cursor-not-allowed disabled:border-border disabled:bg-background aria-invalid:border-destructive',
        'data-[state=checked]:border-primary data-[state=checked]:bg-primary',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex size-full items-center justify-center"
      >
        <span className="size-2 rounded-full bg-primary-foreground" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
