'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  profileWriteSchema,
  type PermissionDto,
  type ProfileDto,
  type ProfileWriteInput,
} from '@oliveira/schemas';
import type { Resolver } from 'react-hook-form';
import { FormCard, FormCardActions, FormCardHeader } from '@/components/forms/form-card';
import { useEntityForm } from '@/components/forms/use-entity-form';
import { ProfileFormFields, ProfileScopeNote } from '@/components/profiles/profile-form-fields';
import { useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import { updateProfileAction } from '../_actions/update-profile';

interface EditProfileFormProps {
  profile: ProfileDto;
  permissions: PermissionDto[];
}

export function EditProfileForm({ profile, permissions }: EditProfileFormProps) {
  const t = useT();
  const { form, isPending, onSubmit } = useEntityForm(
    // Same `.default([])` cast `create-profile-form.tsx` needs — see its comment.
    zodResolver(profileWriteSchema) as Resolver<ProfileWriteInput, unknown, ProfileWriteInput>,
    {
      name: profile.name,
      description: profile.description,
      permissionIds: profile.permissions.map((permission) => permission.id),
    },
    (values) => updateProfileAction(profile.id, values),
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
            title={t('erp.profiles.form.editTitle')}
            titleTestId="profile-form-title"
            {...(profile.isSystem ? { description: t('erp.profiles.form.systemNote') } : {})}
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
      <ProfileFormFields permissions={permissions} code={profile.id} />
    </FormCard>
  );
}
