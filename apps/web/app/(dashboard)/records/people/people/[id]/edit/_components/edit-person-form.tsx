'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useWatch } from 'react-hook-form';
import {
  personFormSchema,
  personToFormValues,
  type AccountDto,
  type Person,
  type PersonFormValues,
} from '@oliveira/schemas';
import { FormCard, FormCardActions, FormCardHeader } from '@/components/forms/form-card';
import { useEntityForm } from '@/components/forms/use-entity-form';
import { AccountSection } from '@/components/people/account-section';
import { PersonFormFields } from '@/components/people/person-form-fields';
import { PersonStatusBadge, PersonTypeBadges } from '@/components/people/person-badges';
import { ROUTES } from '@/lib/navigation/routes';
import { createAccountAction } from '../_actions/create-account';
import { updatePersonAction } from '../_actions/update-person';

interface EditPersonFormProps {
  person: Person;
  account: AccountDto | null;
  isAdmin: boolean;
}

export function EditPersonForm({ person, account, isAdmin }: EditPersonFormProps) {
  const { form, isPending, onSubmit } = useEntityForm(
    zodResolver(personFormSchema),
    personToFormValues(person),
    (values: PersonFormValues) => updatePersonAction(person.id, values),
  );
  // Reactive to the checkboxes the admin is editing right now, not just the
  // types the record was saved with — checking "User" should surface the
  // Account section before the form is even submitted.
  const types = useWatch({ control: form.control, name: 'types' });

  return (
    <FormCard
      containerTestId="person-form-container"
      formTestId="person-form"
      form={form}
      onSubmit={onSubmit}
      header={
        <FormCardHeader
          eyebrow="Editing record"
          title={person.name}
          titleTestId="person-form-title"
          actions={
            <>
              <PersonTypeBadges types={person.types} />
              <PersonStatusBadge active={person.active} />
            </>
          }
        />
      }
      footer={
        <FormCardActions
          isPending={isPending}
          saveLabel="Save changes"
          saveTestId="person-form-button-save"
          cancelHref={ROUTES.people.list}
          cancelTestId="person-form-button-cancel"
        />
      }
      // Outside `<form>`: its own submit button would otherwise nest inside
      // the person form's, which browsers handle unpredictably.
      after={
        <div className="border-t border-border px-6 py-8 sm:px-8">
          <AccountSection
            personId={person.id}
            types={types}
            account={account}
            isAdmin={isAdmin}
            mode="edit"
            createAccount={createAccountAction}
          />
        </div>
      }
    >
      <PersonFormFields />
    </FormCard>
  );
}
