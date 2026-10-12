'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { emptyPersonFormValues, personFormSchema } from '@oliveira/schemas';
import { FormCard, FormCardActions, FormCardHeader } from '@/components/forms/form-card';
import { useEntityForm } from '@/components/forms/use-entity-form';
import { PersonFormFields } from '@/components/people/person-form-fields';
import { useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import { createPersonAction } from '../_actions/create-person';

export function CreatePersonForm() {
  const t = useT();
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
      errorBodyKey="erp.people.form.errorBody"
      header={
        <FormCardHeader
          title={t('erp.people.form.newTitle')}
          titleTestId="person-form-title"
          description={t('erp.people.form.newDescription')}
        />
      }
      footer={
        <FormCardActions
          isPending={isPending}
          saveLabel={t('erp.people.form.save')}
          saveTestId="person-form-button-save"
          cancelHref={ROUTES.people.list}
          cancelTestId="person-form-button-cancel"
          cancelLabel={t('erp.people.form.cancel')}
        />
      }
    >
      <PersonFormFields />
    </FormCard>
  );
}
