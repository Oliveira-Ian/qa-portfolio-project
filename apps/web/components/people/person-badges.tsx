import type { PersonTypeValue } from '@oliveira/schemas';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Type and status read as stamped marks rather than coloured pills — a record
 * in this system is a document, and the two badges are what a clerk would look
 * for first.
 */
const TYPE_LABEL: Record<PersonTypeValue, string> = {
  CLIENT: 'Client',
  SUPPLIER: 'Supplier',
  USER: 'User',
  EMPLOYEE: 'Employee',
};

const TYPE_TONE: Record<PersonTypeValue, string> = {
  CLIENT: 'border-primary/40 bg-primary-light text-primary',
  SUPPLIER: 'border-signal/40 bg-signal-light text-signal-strong',
  USER: 'border-foreground/25 bg-muted text-foreground',
  EMPLOYEE: 'border-foreground/25 bg-muted text-foreground',
};

export function PersonTypeBadge({
  type,
  className,
}: {
  type: PersonTypeValue;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn('eyebrow rounded-sm border px-2 py-0.5', TYPE_TONE[type], className)}
    >
      {TYPE_LABEL[type]}
    </Badge>
  );
}

/** A person can hold more than one role at once — render one badge per type. */
export function PersonTypeBadges({
  types,
  className,
}: {
  types: PersonTypeValue[];
  className?: string;
}) {
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1', className)}>
      {types.map((type) => (
        <PersonTypeBadge key={type} type={type} />
      ))}
    </span>
  );
}

export function PersonStatusBadge({ active, className }: { active: boolean; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'eyebrow rounded-sm border px-2 py-0.5',
        active
          ? 'border-toast-success/40 bg-toast-success/10 text-toast-success'
          : 'border-border bg-muted text-muted-foreground',
        className,
      )}
    >
      {active ? 'Active' : 'Inactive'}
    </Badge>
  );
}
