import { cn } from '@/lib/utils';

/*
 * A person on a work order (HANDOFF-FSM § 5.6): initials on one of four tints,
 * picked from the id so the same person always has the same colour, and the
 * name. Unassigned is a grey "—" and the word.
 */
const TINTS = [
  'bg-fsm-avatar-1 text-fsm-avatar-1-fg',
  'bg-fsm-avatar-2 text-fsm-avatar-2-fg',
  'bg-fsm-avatar-3 text-fsm-avatar-3-fg',
  'bg-fsm-avatar-4 text-fsm-avatar-4-fg',
];

function tintFor(key: string): string {
  let hash = 0;
  for (const char of key) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return TINTS[Math.abs(hash) % TINTS.length]!;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase() || '—';
}

export function Avatar({
  name,
  id,
  size = 'md',
  className,
}: {
  name: string | null;
  id?: string | null;
  size?: 'md' | 'lg';
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-[0.02em]',
        size === 'lg' ? 'size-9 text-[12.5px]' : 'size-[26px] text-[10.5px]',
        name ? tintFor(id ?? name) : 'bg-fsm-avatar-0 text-fsm-avatar-0-fg',
        className,
      )}
    >
      {name ? initialsOf(name) : '—'}
    </span>
  );
}

export function PersonChip({
  name,
  id,
  unassignedLabel,
  size = 'md',
  subline,
}: {
  name: string | null;
  id?: string | null;
  unassignedLabel: string;
  size?: 'md' | 'lg';
  subline?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex min-w-0 items-center gap-2 text-[13.5px]',
        !name && 'text-text-muted',
      )}
    >
      <Avatar name={name} id={id ?? null} size={size} />
      <span className="flex min-w-0 flex-col">
        <span className={cn('truncate', size === 'lg' && 'font-semibold text-foreground')}>
          {name ?? unassignedLabel}
        </span>
        {subline ? <span className="truncate text-[12.5px] text-text-3">{subline}</span> : null}
      </span>
    </span>
  );
}
