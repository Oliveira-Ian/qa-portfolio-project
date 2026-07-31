import type { LucideIcon } from 'lucide-react';
import { formatCount } from '@/lib/format';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number;
  icon?: LucideIcon;
  className?: string;
  'data-testid'?: string;
}

/**
 * One cell of a KPI row — an eyebrow label, a large tabular value, and an
 * optional icon. Expects a `<dl>` grid wrapper (it renders `dt`/`dd`, not the
 * list itself), the same shape `/home`'s stat row already used by hand.
 */
export function StatCard({ label, value, icon: Icon, className, ...props }: StatCardProps) {
  return (
    <div className={cn('bg-card px-5 py-6', className)} {...props}>
      <div className="flex items-center justify-between gap-2">
        <dt className="eyebrow text-muted-foreground">{label}</dt>
        {Icon ? <Icon aria-hidden="true" className="size-4 text-muted-foreground" /> : null}
      </div>
      <dd className="tabular mt-2 text-3xl leading-none font-medium text-foreground">
        {formatCount(value)}
      </dd>
    </div>
  );
}
