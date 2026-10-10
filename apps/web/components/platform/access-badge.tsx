'use client';

import { Check, Lock } from 'lucide-react';
import { useT } from '@/lib/i18n/provider';
import { cn } from '@/lib/utils';

type AccessState = 'granted' | 'none' | 'soon';

/**
 * The Platform's answer to "can this member open the product" (handoff § 4, "Access
 * badge"): granted, none (with a lock) or soon. Always the Platform's own
 * colours — product access never takes a product accent, so it can't be mistaken
 * for a permission inside the product. Mono, uppercase, a dot or an icon and text.
 */
const STATE_STYLE: Record<AccessState, string> = {
  granted: 'bg-[var(--olv-navy-50)] text-[var(--olv-navy-600)]',
  none: 'bg-neutral-light text-neutral-on',
  soon: 'bg-[var(--olv-terracotta-50)] text-[var(--olv-terracotta-700)]',
};

export function AccessBadge({ state, className }: { state: AccessState; className?: string }) {
  const t = useT();

  return (
    <span
      data-slot="access-badge"
      data-state={state}
      className={cn(
        'inline-flex h-[22px] w-fit shrink-0 items-center gap-1.5 rounded-xs px-2 font-mono text-[11px] font-medium tracking-[0.08em] whitespace-nowrap uppercase',
        STATE_STYLE[state],
        className,
      )}
    >
      {state === 'granted' ? <Check className="size-3" aria-hidden="true" /> : null}
      {state === 'none' ? <Lock className="size-3" aria-hidden="true" /> : null}
      {state === 'soon' ? (
        <i aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      ) : null}
      {t(
        state === 'granted'
          ? 'access.badge.granted'
          : state === 'none'
            ? 'access.badge.none'
            : 'access.badge.soon',
      )}
    </span>
  );
}
