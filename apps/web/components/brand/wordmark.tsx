import Image from 'next/image';
import { cn } from '@/lib/utils';

interface WordmarkProps {
  className?: string;
  /** Muted variant for the second word — reads better on a dark chrome. */
  tone?: 'light' | 'dark';
  size?: number;
}

/**
 * The olive tree is the company's name made literal — "Oliveira" is Portuguese
 * for olive tree — so the mark and the wordmark always travel together.
 */
export function Wordmark({ className, tone = 'dark', size = 28 }: WordmarkProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <Image
        src="/images/logo-ian2.png"
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        className="object-contain mix-blend-multiply dark:mix-blend-normal"
        priority
      />
      <span
        className="font-display text-base leading-none font-semibold tracking-tight"
        translate="no"
      >
        Oliveira
        <span
          className={cn('font-normal', tone === 'light' ? 'opacity-60' : 'text-muted-foreground')}
        >
          {' '}
          ERP
        </span>
      </span>
    </span>
  );
}
