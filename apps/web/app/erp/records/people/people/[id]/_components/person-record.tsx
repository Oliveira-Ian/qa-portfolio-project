'use client';

import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { useForm } from 'react-hook-form';
import {
  personToFormValues,
  type AccountDto,
  type Person,
  type PersonFormValues,
} from '@oliveira/schemas';
import { FormCard } from '@/components/forms/form-card';
import { AccountSection } from '@/components/people/account-section';
import { PersonFormFields } from '@/components/people/person-form-fields';
import { PersonRecordHeader } from '@/components/people/person-record-header';
import { useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import { Button } from '@/components/ui/button';

interface PersonRecordProps {
  person: Person;
  account: AccountDto | null;
  isCompanyAdmin: boolean;
  /** The record's header carries Edit; without the permission it carries only Back. */
  canEdit: boolean;
}

/**
 * The read-only sheet.
 *
 * It reuses the same field layout as create and edit rather than a separate
 * definition list, so a field can never appear on the form and go missing here.
 * There is no Save button at all — a disabled one would suggest the record
 * could be changed from this screen, and it can't. Edit and Back sit in the
 * page header, where the actions of every screen are.
 */
export function PersonRecord({ person, account, isCompanyAdmin, canEdit }: PersonRecordProps) {
  const t = useT();
  // A form instance purely as a value container; it is never submitted.
  const form = useForm<PersonFormValues>({ defaultValues: personToFormValues(person) });

  return (
    <FormCard
      containerTestId="person-form-container"
      formTestId="person-form"
      form={form}
      header={
        <PersonRecordHeader
          person={person}
          actions={
            <>
              <Button type="button" variant="ghost" asChild data-testid="person-form-button-cancel">
                <Link href={ROUTES.people.list}>{t('erp.people.record.back')}</Link>
              </Button>
              {canEdit ? (
                <Button asChild data-testid="person-record-button-edit">
                  <Link href={ROUTES.people.edit(person.id)}>
                    <Pencil aria-hidden="true" />
                    {t('erp.people.record.editRecord')}
                  </Link>
                </Button>
              ) : null}
            </>
          }
        />
      }
      after={
        <AccountSection
          personId={person.id}
          types={person.types}
          account={account}
          isCompanyAdmin={isCompanyAdmin}
          mode="view"
        />
      }
    >
      <PersonFormFields disabled />
    </FormCard>
  );
}
