import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { formatCount } from '@/lib/format';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number;
  icon?: LucideIcon;
  /** The interface language, for the digits — the page knows it (`getLocale()`). */
  locale?: string;
  /** Where the number leads — the list behind it, already filtered. The whole card is the target. */
  href?: string;
  /** Draws the number in the danger ink when it is not zero (overdue work, say). */
  isAlert?: boolean;
  className?: string;
  'data-testid'?: string;
}

/**
 * One cell of a KPI row — a mono overline label, a large tabular value, and an
 * optional icon. Expects a `<dl>` grid wrapper (it renders `dt`/`dd`, not the
 * list itself), the same shape `/home`'s stat row already used by hand. With
 * `href`, the value is a link stretched over the cell, so the markup stays a
 * valid description list.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  locale,
  href,
  isAlert = false,
  className,
  ...props
}: StatCardProps) {
  const number = formatCount(value, locale);

  return (
    <div
      className={cn(
        'relative bg-surface px-5 py-5',
        href && 'transition-colors focus-within:ring-focus hover:bg-surface-2',
        className,
      )}
      {...props}
    >
      <dt className="olv-overline flex items-center justify-between gap-2 text-text-3">
        <span>{label}</span>
        {Icon ? <Icon aria-hidden="true" className="size-4 text-text-3" /> : null}
      </dt>
      <dd
        className={cn(
          'olv-data tabular mt-2 text-[28px] leading-none font-medium',
          isAlert && value > 0 ? 'text-destructive' : 'text-foreground',
        )}
      >
        {href ? (
          <Link
            href={href}
            aria-label={`${label}: ${number}`}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {number}
          </Link>
        ) : (
          number
        )}
      </dd>
    </div>
  );
}
