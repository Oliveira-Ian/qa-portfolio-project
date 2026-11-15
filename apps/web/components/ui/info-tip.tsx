'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface InfoTipProps {
  /** What the icon is about, for assistive technology — "About Technician". */
  label: string;
  /** The explanation, shown in the tooltip. */
  children: React.ReactNode;
  className?: string;
  'data-testid'?: string;
}

/**
 * An "i" beside a field's label that explains it on demand, instead of a line
 * of help text under the field that takes room and pushes its neighbours out of
 * line. Hover or keyboard focus shows it (the design's 200ms tooltip); a click
 * or a tap shows it too, since touch has no hover. The button sits outside the
 * `<label>`, so pressing it never moves focus into the field.
 */
export function InfoTip({ label, children, className, ...props }: InfoTipProps) {
  const [open, setOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label}
            onClick={(event) => {
              event.preventDefault();
              setOpen(true);
            }}
            className={cn(
              // The icon is 16px; the hit area is grown by a transparent ring, not the icon.
              'relative inline-flex size-4 shrink-0 items-center justify-center rounded-full text-text-3 outline-none after:absolute after:-inset-2 hover:text-foreground focus-visible:text-foreground focus-visible:ring-focus',
              className,
            )}
            data-testid={props['data-testid']}
          >
            <Info className="size-4" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6} className="max-w-64">
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
