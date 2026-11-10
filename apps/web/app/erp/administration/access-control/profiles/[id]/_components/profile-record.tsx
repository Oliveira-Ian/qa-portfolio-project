'use client';

import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { useForm } from 'react-hook-form';
import type { PermissionDto, ProfileDto, ProfileWriteInput } from '@oliveira/schemas';
import { FormCard, FormCardHeader } from '@/components/forms/form-card';
import { ProfileFormFields, ProfileScopeNote } from '@/components/profiles/profile-form-fields';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';

interface ProfileRecordProps {
  profile: ProfileDto;
  permissions: PermissionDto[];
}

/**
 * A profile, read-only: the same fields as the edit form, disabled, with Back
 * and Edit in the page header — the shape of every record's view page.
 */
export function ProfileRecord({ profile, permissions }: ProfileRecordProps) {
  const t = useT();
  // A value container only; this form is never submitted.
  const form = useForm<ProfileWriteInput>({
    defaultValues: {
      name: profile.name,
      description: profile.description,
      permissionIds: profile.permissions.map((permission) => permission.id),
    },
  });

  return (
    <FormCard
      containerTestId="profile-form-container"
      formTestId="profile-form"
      form={form}
      header={
        <>
          <FormCardHeader
            title={profile.name}
            titleTestId="profile-record-title"
            {...(profile.isSystem ? { description: t('erp.profiles.form.systemNote') } : {})}
            actions={
              <>
                <Button variant="ghost" asChild data-testid="profile-record-button-back">
                  <Link href={ROUTES.profiles.list}>{t('erp.profiles.record.back')}</Link>
                </Button>
                <Button asChild data-testid="profile-record-button-edit">
                  <Link href={ROUTES.profiles.edit(profile.id)}>
                    <Pencil aria-hidden="true" />
                    {t('erp.profiles.record.edit')}
                  </Link>
                </Button>
              </>
            }
          />
          <ProfileScopeNote />
        </>
      }
    >
      <ProfileFormFields permissions={permissions} code={profile.id} disabled />
    </FormCard>
  );
}
