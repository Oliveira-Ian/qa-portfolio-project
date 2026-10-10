import type { LucideIcon } from 'lucide-react';
import { formatCount } from '@/lib/format';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number;
  icon?: LucideIcon;
  /** The interface language, for the digits — the page knows it (`getLocale()`). */
  locale?: string;
  className?: string;
  'data-testid'?: string;
}

/**
 * One cell of a KPI row — a mono overline label, a large tabular value, and an
 * optional icon. Expects a `<dl>` grid wrapper (it renders `dt`/`dd`, not the
 * list itself), the same shape `/home`'s stat row already used by hand.
 */
export function StatCard({ label, value, icon: Icon, locale, className, ...props }: StatCardProps) {
  return (
    <div className={cn('bg-surface px-5 py-5', className)} {...props}>
      <div className="flex items-center justify-between gap-2">
        <dt className="olv-overline text-text-3">{label}</dt>
        {Icon ? <Icon aria-hidden="true" className="size-4 text-muted-foreground" /> : null}
      </div>
      <dd className="olv-data tabular mt-2 text-[28px] leading-none font-medium text-foreground">
        {formatCount(value, locale)}
      </dd>
    </div>
  );
}
