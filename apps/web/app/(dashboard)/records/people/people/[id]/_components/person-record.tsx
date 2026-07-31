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
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/navigation/routes';

interface PersonRecordProps {
  person: Person;
  account: AccountDto | null;
  isAdmin: boolean;
}

/**
 * The read-only sheet.
 *
 * It reuses the same field layout as create and edit rather than a separate
 * definition list, so a field can never appear on the form and go missing here.
 * There is no Save button at all — a disabled one would suggest the record
 * could be changed from this screen, and it can't.
 */
export function PersonRecord({ person, account, isAdmin }: PersonRecordProps) {
  // A form instance purely as a value container; it is never submitted.
  const form = useForm<PersonFormValues>({ defaultValues: personToFormValues(person) });

  return (
    <FormCard
      containerTestId="person-form-container"
      formTestId="person-form"
      form={form}
      header={<PersonRecordHeader person={person} />}
      footer={
        <>
          <Button asChild data-testid="person-record-button-edit">
            <Link href={ROUTES.people.edit(person.id)}>
              <Pencil aria-hidden="true" />
              Edit record
            </Link>
          </Button>
          <Button type="button" variant="outline" asChild data-testid="person-form-button-cancel">
            <Link href={ROUTES.people.list}>Back</Link>
          </Button>
        </>
      }
      after={
        <div className="border-t border-border px-6 py-8 sm:px-8">
          <AccountSection
            personId={person.id}
            types={person.types}
            account={account}
            isAdmin={isAdmin}
            mode="view"
          />
        </div>
      }
    >
      <PersonFormFields disabled />
    </FormCard>
  );
}
