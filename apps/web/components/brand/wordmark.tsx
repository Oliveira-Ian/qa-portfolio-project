import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * The Oliveira mark and lockups (design handoff § 1, board 06).
 *
 * "Oliveira" and the crest never change; only the product name and its accent
 * do. On the dark shell the crest is `oliveira-mark-dark.svg` at 26–28px high
 * and the product name takes the accent's 300 step; on a light surface it is
 * `oliveira-mark-light.svg` and the 600 step. The crest is never recoloured
 * with a product accent (carmine belongs to the logo only).
 *
 * Product names are proper nouns and always English — they are passed in, never
 * translated.
 */
const MARK_RATIO = 50 / 56;

interface BrandMarkProps {
  tone?: 'dark' | 'light';
  /** Height in px; the handoff asks for 26–28 in the shell, 24 at the smallest on light surfaces. */
  height?: number;
  className?: string;
}

export function BrandMark({ tone = 'dark', height = 28, className }: BrandMarkProps) {
  return (
    <Image
      src={`/brand/oliveira-mark-${tone}.svg`}
      alt=""
      aria-hidden="true"
      width={Math.round(height * MARK_RATIO)}
      height={height}
      className={cn('shrink-0 select-none', className)}
      priority
    />
  );
}

interface WordmarkProps {
  /** The product's name as a proper noun ("Platform", "ERP", "FSM"); omit for "Oliveira" alone. */
  product?: string;
  tone?: 'dark' | 'light';
  size?: number;
  /** A hairline between "Oliveira" and the product name, as on the auth panel. */
  divider?: boolean;
  className?: string;
}

export function Wordmark({
  product,
  tone = 'dark',
  size = 28,
  divider = false,
  className,
}: WordmarkProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <BrandMark tone={tone} height={size} />
      <span
        className="font-display text-base leading-none font-semibold tracking-[-0.01em] whitespace-nowrap"
        translate="no"
      >
        <span className={tone === 'dark' ? 'text-white' : 'text-foreground'}>Oliveira</span>
        {product ? (
          <>
            {divider ? (
              <span
                aria-hidden="true"
                className={cn(
                  'mx-3 inline-block h-4 w-px align-middle',
                  tone === 'dark' ? 'bg-white/20' : 'bg-foreground/20',
                )}
              />
            ) : (
              ' '
            )}
            <span
              className={cn('font-medium', tone === 'dark' ? 'text-accent-300' : 'text-accent-600')}
            >
              {product}
            </span>
          </>
        ) : null}
      </span>
    </span>
  );
}
