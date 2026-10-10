'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { profileWriteSchema, type PermissionDto, type ProfileWriteInput } from '@oliveira/schemas';
import type { Resolver } from 'react-hook-form';
import { FormCard, FormCardActions, FormCardHeader } from '@/components/forms/form-card';
import { useEntityForm } from '@/components/forms/use-entity-form';
import { ProfileFormFields } from '@/components/profiles/profile-form-fields';
import { ROUTES } from '@/lib/navigation/routes';
import { createProfileAction } from '../_actions/create-profile';

const EMPTY_VALUES = { name: '', description: '', permissionIds: [] };

export function CreateProfileForm({ permissions }: { permissions: PermissionDto[] }) {
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
      header={
        <FormCardHeader
          eyebrow="Access control"
          title="New profile"
          titleTestId="profile-form-title"
          description="A name and the permissions it grants — accounts pick this up next."
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
