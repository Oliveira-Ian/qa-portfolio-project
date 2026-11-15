'use client';

import * as React from 'react';
import { Switch as SwitchPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';

/**
 * 36 × 20 with a 16px knob. On/off settings and product access. Off is a warm
 * grey (#B7B2A8 in the handoff, which has no semantic token for it); on is the
 * product accent — except on access UI, which the caller scopes to the Platform
 * with `data-product="platform"` so access never looks like a product permission.
 * Saved with the form's Save, never on toggle.
 */
function Switch({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: 'sm' | 'default';
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        'peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent bg-[#b7b2a8] transition-colors duration-150 outline-none after:absolute after:-inset-x-3 after:-inset-y-2 hover:bg-[#a09a8f] focus-visible:ring-focus aria-invalid:border-destructive data-[size=default]:h-5 data-[size=default]:w-9 data-[size=sm]:h-4 data-[size=sm]:w-7 data-[state=checked]:bg-primary data-[state=checked]:hover:bg-primary-hover data-disabled:cursor-not-allowed data-disabled:bg-[#e6e2da] data-disabled:data-[state=checked]:bg-primary-disabled-bg',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block rounded-full bg-white shadow-[0_1px_2px_rgba(18,21,27,.3),0_0_0_.5px_rgba(18,21,27,.06)] ring-0 transition-transform duration-[160ms] ease-[cubic-bezier(.3,.7,.4,1)] group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 group-data-[size=default]/switch:translate-x-0.5 group-data-[size=sm]/switch:translate-x-0.5 group-data-[size=default]/switch:data-[state=checked]:translate-x-[18px] group-data-[size=sm]/switch:data-[state=checked]:translate-x-[14px] group-data-disabled/switch:shadow-none"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
