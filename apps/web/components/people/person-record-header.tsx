import Link from 'next/link';
import type { Person } from '@oliveira/schemas';
import { formatDateTime } from '@/lib/format';
import { ROUTES } from '@/lib/navigation/routes';
import { PersonStatusBadge, PersonTypeBadges } from './person-badges';

interface PersonRecordHeaderProps {
  person: Person;
}

/**
 * The title block.
 *
 * Borrowed from the cartouche on a technical drawing — the sheet's identity in
 * the corner, in a fixed order, so anyone picking it up knows what they are
 * holding before reading a single field. Name in display type, document in
 * mono because it is a number people compare digit by digit, and the two marks
 * that decide how the record is treated.
 */
export function PersonRecordHeader({ person }: PersonRecordHeaderProps) {
  return (
    <div className="border-b border-border bg-muted/40 px-6 py-6 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className="eyebrow text-primary">Record</p>
          <h1
            className="mt-1.5 truncate font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
            data-testid="person-form-title"
          >
            {person.name}
          </h1>
          {person.document ? (
            <p className="tabular mt-2 text-sm text-muted-foreground">
              <span className="sr-only">{person.documentType}: </span>
              <span translate="no">{person.document}</span>
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <PersonTypeBadges types={person.types} />
          <PersonStatusBadge active={person.active} />
        </div>
      </div>

      <dl className="mt-6 grid gap-x-8 gap-y-3 border-t border-border pt-5 text-xs sm:grid-cols-3">
        <div className="flex items-baseline gap-2">
          <dt className="eyebrow text-text-muted">Opened</dt>
          <dd className="tabular text-muted-foreground">{formatDateTime(person.createdAt)}</dd>
        </div>
        <div className="flex items-baseline gap-2">
          <dt className="eyebrow text-text-muted">Updated</dt>
          <dd className="tabular text-muted-foreground">{formatDateTime(person.updatedAt)}</dd>
        </div>
        <div className="flex min-w-0 items-baseline gap-2">
          <dt className="eyebrow text-text-muted">Sheet</dt>
          <dd className="tabular truncate text-muted-foreground" translate="no">
            {person.id.slice(0, 8)}
          </dd>
        </div>
      </dl>

      <p className="mt-5 text-sm">
        <Link
          href={ROUTES.people.list}
          className="rounded-sm text-primary underline underline-offset-4 hover:text-primary-hover focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
          data-testid="person-record-link-back"
        >
          Back to the registry
        </Link>
      </p>
    </div>
  );
}
