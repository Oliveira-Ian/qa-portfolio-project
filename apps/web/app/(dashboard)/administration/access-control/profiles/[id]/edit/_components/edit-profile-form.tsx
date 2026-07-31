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
import { ProfileFormFields } from '@/components/profiles/profile-form-fields';
import { ROUTES } from '@/lib/navigation/routes';
import { updateProfileAction } from '../_actions/update-profile';

interface EditProfileFormProps {
  profile: ProfileDto;
  permissions: PermissionDto[];
}

export function EditProfileForm({ profile, permissions }: EditProfileFormProps) {
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
      header={
        <FormCardHeader
          eyebrow="Access control"
          title="Edit profile"
          titleTestId="profile-form-title"
          description={
            profile.isSystem
              ? 'This is a system profile — it can be edited, but not deleted.'
              : undefined
          }
        />
      }
      footer={
        <FormCardActions
          isPending={isPending}
          saveLabel="Save profile"
          saveTestId="profile-form-button-save"
          cancelHref={ROUTES.profiles.list}
          cancelTestId="profile-form-button-cancel"
        />
      }
    >
      <ProfileFormFields permissions={permissions} />
    </FormCard>
  );
}
