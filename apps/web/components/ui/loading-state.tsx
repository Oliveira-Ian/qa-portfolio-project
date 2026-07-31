import { Skeleton } from '@/components/ui/skeleton';

interface LoadingStateProps {
  rows?: number;
  columns?: number;
  /** Off for a grid whose columns don't start with a selection checkbox. */
  showCheckbox?: boolean;
}

/**
 * Shown while a listing's data is being read — mirrors the shape of the real
 * grid (a bordered card of rows) so the page settles into place instead of
 * jumping once the data arrives. Column widths cycle through a fixed set
 * rather than being measured, which is close enough for a placeholder.
 *
 * Every route's `loading.tsx` under `app/(dashboard)/` renders this for its
 * grid rows, keeping only its own header skeleton (title width, whether it
 * has a description line) as route-specific.
 */
const COLUMN_WIDTHS = ['w-16', 'flex-1', 'w-20', 'w-28', 'w-24'];

export function LoadingState({ rows = 6, columns = 5, showCheckbox = true }: LoadingStateProps) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      className="overflow-hidden rounded-lg border border-border bg-card shadow-card"
    >
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 border-b border-border px-4 py-4">
          {showCheckbox ? <Skeleton className="size-4 shrink-0" /> : null}
          {Array.from({ length: columns }).map((_, columnIndex) => (
            <Skeleton
              key={columnIndex}
              className={`h-4 shrink-0 ${COLUMN_WIDTHS[columnIndex % COLUMN_WIDTHS.length]}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
