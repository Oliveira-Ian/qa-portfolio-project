'use client';

import type { ReactNode } from 'react';
import type { Person } from '@oliveira/schemas';
import { PageHeader } from '@/components/layout/page-header';
import { formatDateMedium } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n/provider';
import { PersonStatusBadge, PersonTypeBadges } from './person-badges';

interface PersonRecordHeaderProps {
  person: Person;
  /** Back / Edit — the page header's actions. */
  actions?: ReactNode;
}

/**
 * The record's page header: the name as the H1, a mono line with the document,
 * the dates and the sheet number — a number people compare digit by digit — and
 * the two marks that decide how the record is treated (type tags and status),
 * on the right with the actions. The breadcrumb above it is the shell's.
 */
export function PersonRecordHeader({ person, actions }: PersonRecordHeaderProps) {
  const t = useT();
  const locale = useLocale();

  return (
    <PageHeader
      title={person.name}
      titleTestId="person-form-title"
      meta={
        <span className="tabular flex flex-wrap gap-x-4 gap-y-1">
          {person.document ? (
            <span>
              <span className="sr-only">{person.documentType}: </span>
              <span translate="no">{person.document}</span>
            </span>
          ) : null}
          <span>
            {t('erp.people.record.opened')} {formatDateMedium(person.createdAt, locale)}
          </span>
          <span>
            {t('erp.people.record.updated')} {formatDateMedium(person.updatedAt, locale)}
          </span>
          <span translate="no">
            {t('erp.people.record.sheet')} {person.id.slice(0, 8)}
          </span>
        </span>
      }
      actions={
        <>
          <PersonTypeBadges types={person.types} />
          <PersonStatusBadge active={person.active} />
          {actions}
        </>
      }
    />
  );
}
