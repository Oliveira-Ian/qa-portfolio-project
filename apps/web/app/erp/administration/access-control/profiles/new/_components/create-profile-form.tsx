'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { profileWriteSchema, type PermissionDto, type ProfileWriteInput } from '@oliveira/schemas';
import type { Resolver } from 'react-hook-form';
import { FormCard, FormCardActions, FormCardHeader } from '@/components/forms/form-card';
import { useEntityForm } from '@/components/forms/use-entity-form';
import { ProfileFormFields, ProfileScopeNote } from '@/components/profiles/profile-form-fields';
import { useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import { createProfileAction } from '../_actions/create-profile';

const EMPTY_VALUES = { name: '', description: '', permissionIds: [] };

export function CreateProfileForm({ permissions }: { permissions: PermissionDto[] }) {
  const t = useT();
  const { form, isPending, onSubmit } = useEntityForm(
    // `permissionIds` has a schema-level `.default([])`, which makes zod's
    // input type disagree with `ProfileWriteInput` (its output type) under
    // `exactOptionalPropertyTypes` — harmless here since `EMPTY_VALUES` always
    // supplies `permissionIds`, so the default never fires.
    zodResolver(profileWriteSchema) as Resolver<ProfileWriteInput, unknown, ProfileWriteInput>,
    EMPTY_VALUES,
    createProfileAction,
  );

  return (
    <FormCard
      containerTestId="profile-form-container"
      formTestId="profile-form"
      form={form}
      onSubmit={onSubmit}
      errorBodyKey="erp.profiles.form.errorBody"
      header={
        <>
          <FormCardHeader
            title={t('erp.profiles.form.newTitle')}
            titleTestId="profile-form-title"
          />
          <ProfileScopeNote />
        </>
      }
      footer={
        <FormCardActions
          isPending={isPending}
          saveLabel={t('erp.profiles.form.save')}
          saveTestId="profile-form-button-save"
          cancelHref={ROUTES.profiles.list}
          cancelTestId="profile-form-button-cancel"
          cancelLabel={t('erp.profiles.form.cancel')}
        />
      }
    >
      <ProfileFormFields permissions={permissions} />
    </FormCard>
  );
}
