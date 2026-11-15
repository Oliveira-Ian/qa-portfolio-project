'use client';

import { InfoTip } from '@/components/ui/info-tip';
import { useT } from '@/lib/i18n/provider';

/**
 * One section of a record form: its title above its fields, which get the card's
 * whole width (decided 2026-11-15, after the work order form tried it — a title
 * column on the left left half the width unused). Sections are stacked on one
 * page — a record's fields are all visible and reachable by scrolling, never
 * hidden behind tabs (a person's form used to be four tabs, with eight of its
 * twelve fields out of sight).
 *
 * `description` explains the section on demand, in an "i" beside the title —
 * the same as a field's `help` — instead of a line that takes room.
 * `optionalLabel` marks a section nobody has to fill in.
 */
export function FormSection({
  title,
  description,
  optionalLabel,
  children,
  ...props
}: {
  title: string;
  description?: string;
  optionalLabel?: string;
  children: React.ReactNode;
} & Omit<React.ComponentProps<'section'>, 'title'>) {
  const t = useT();

  return (
    <section className="grid grid-cols-1 gap-y-4" {...props}>
      <div className="flex items-center gap-1.5">
        <h2 className="text-base leading-[22px]">
          {title}
          {optionalLabel ? (
            <span className="olv-overline ml-2 align-middle text-text-3">{optionalLabel}</span>
          ) : null}
        </h2>
        {description ? (
          <InfoTip label={t('common.aboutField', { label: title })}>{description}</InfoTip>
        ) : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
