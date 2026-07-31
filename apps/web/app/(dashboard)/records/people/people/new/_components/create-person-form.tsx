'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { emptyPersonFormValues, personFormSchema } from '@oliveira/schemas';
import { FormCard, FormCardActions, FormCardHeader } from '@/components/forms/form-card';
import { useEntityForm } from '@/components/forms/use-entity-form';
import { PersonFormFields } from '@/components/people/person-form-fields';
import { ROUTES } from '@/lib/navigation/routes';
import { createPersonAction } from '../_actions/create-person';

export function CreatePersonForm() {
  const { form, isPending, onSubmit } = useEntityForm(
    zodResolver(personFormSchema),
    emptyPersonFormValues,
    createPersonAction,
  );

  return (
    <FormCard
      containerTestId="person-form-container"
      formTestId="person-form"
      form={form}
      onSubmit={onSubmit}
      header={
        <FormCardHeader
          eyebrow="Registry"
          title="New person"
          titleTestId="person-form-title"
          description="A client or a supplier. Name, type and document are enough to open the record."
        />
      }
      footer={
        <FormCardActions
          isPending={isPending}
          saveLabel="Save person"
          saveTestId="person-form-button-save"
          cancelHref={ROUTES.people.list}
          cancelTestId="person-form-button-cancel"
        />
      }
    >
      <PersonFormFields />
    </FormCard>
  );
}
