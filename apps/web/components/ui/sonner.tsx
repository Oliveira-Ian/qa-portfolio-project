'use client';

import { Toaster as Sonner, type ToasterProps } from 'sonner';
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-react';
import { useT } from '@/lib/i18n/provider';

/**
 * The Toast — Sonner, as before. Its API (`toast.success()`, `toast.error()`, …),
 * its queue, its timings and every trigger in the app are untouched; only the
 * visual layer follows the design (handoff § 4a):
 *
 * - a white elevated card, 380px (full width less 32px on mobile), radius 10;
 * - a 28px tone chip holding the same icons the Alert uses;
 * - the dismiss button, and a 2px timer bar in the tone that shrinks while the
 *   toast is on screen and pauses while it is hovered or focused;
 * - bottom-right on desktop, 24px from the edges, at most 3 visible and newest
 *   nearest the edge; at the bottom on mobile.
 *
 * `unstyled` drops Sonner's own look so these classes are the whole of it, and
 * the tones come from the same tokens the Alert reads.
 */
const tone = {
  success: 'after:bg-success/55 [&_[data-icon]]:bg-success-light [&_[data-icon]]:text-success',
  info: 'after:bg-info/55 [&_[data-icon]]:bg-info-light [&_[data-icon]]:text-info',
  warning: 'after:bg-warning/55 [&_[data-icon]]:bg-warning-light [&_[data-icon]]:text-warning',
  error: 'after:bg-danger/55 [&_[data-icon]]:bg-danger-light [&_[data-icon]]:text-danger',
} as const;

const Toaster = ({ ...props }: ToasterProps) => {
  const t = useT();

  return (
    <Sonner
      className="toaster group"
      theme="light"
      position="bottom-right"
      offset={24}
      mobileOffset={16}
      visibleToasts={3}
      closeButton
      containerAriaLabel={t('common.notifications')}
      icons={{
        success: <CircleCheckIcon className="size-4" aria-hidden="true" />,
        info: <InfoIcon className="size-4" aria-hidden="true" />,
        warning: <TriangleAlertIcon className="size-4" aria-hidden="true" />,
        error: <OctagonXIcon className="size-4" aria-hidden="true" />,
        loading: <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />,
        close: <XIcon className="size-4" aria-hidden="true" />,
      }}
      style={{ '--width': 'var(--olv-toast-w)' } as React.CSSProperties}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'cn-toast olv-toast-card group/toast relative flex w-full items-start gap-3 overflow-hidden rounded-lg border border-border bg-card p-3.5 pr-11 text-foreground shadow-menu ' +
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          icon: 'mt-0 grid size-7 shrink-0 place-items-center rounded-md',
          content: 'flex min-w-0 flex-1 flex-col gap-0.5 pt-1',
          title: 'text-sm leading-[1.35] font-semibold text-foreground',
          description: 'text-[13px] leading-[1.45] text-text-3',
          closeButton:
            'absolute top-2 right-2 grid size-7 place-items-center rounded-md border-0 bg-transparent text-text-3 transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          actionButton:
            'inline-flex h-auto items-center rounded-sm bg-transparent px-0 py-0.5 text-[13px] font-semibold text-primary underline-offset-3 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          cancelButton:
            'inline-flex h-auto items-center rounded-sm bg-transparent px-0 py-0.5 text-[13px] font-semibold text-text-3 underline-offset-3 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          success: tone.success,
          info: tone.info,
          warning: tone.warning,
          error: tone.error,
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
