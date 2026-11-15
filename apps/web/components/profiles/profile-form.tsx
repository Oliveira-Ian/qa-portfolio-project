'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil } from 'lucide-react';
import type { Resolver } from 'react-hook-form';
import {
  profileWriteSchema,
  type PermissionDto,
  type Product,
  type ProfileDto,
  type ProfileWriteInput,
} from '@oliveira/schemas';
import { FormCard, FormCardActions, FormCardHeader } from '@/components/forms/form-card';
import type { RecordFormMode } from '@/components/forms/record-form';
import { useEntityForm } from '@/components/forms/use-entity-form';
import { Button } from '@/components/ui/button';
import type { ActionResult } from '@/lib/actions';
import { useT } from '@/lib/i18n/provider';
import { ProfileFormFields, ProfileScopeNote } from './profile-form-fields';
import { PROFILE_ROUTES } from './profile-list';

interface ProfileFormProps {
  product: Product;
  mode: RecordFormMode;
  profile?: ProfileDto;
  permissions: PermissionDto[];
  /** Creates the profile, or updates it when an id is given — the product's own Server Action. */
  saveAction?: (values: ProfileWriteInput, id?: number) => Promise<ActionResult & { id?: string }>;
}

const EMPTY_VALUES: ProfileWriteInput = { name: '', description: '', permissionIds: [] };

/**
 * A product's access profile in its three modes — new, view and edit share
 * the same fields, and the permission matrix shows that product's catalog
 * only (an ERP profile never offers an FSM permission, nor the reverse).
 */
export function ProfileForm({ product, mode, profile, permissions, saveAction }: ProfileFormProps) {
  const t = useT();
  const routes = PROFILE_ROUTES[product];
  const isView = mode === 'view';
  const { form, isPending, onSubmit } = useEntityForm(
    // `permissionIds` has a schema-level `.default([])`, which makes zod's input
    // type disagree with `ProfileWriteInput` under `exactOptionalPropertyTypes` —
    // harmless here, since the values always carry `permissionIds`.
    zodResolver(profileWriteSchema) as Resolver<ProfileWriteInput, unknown, ProfileWriteInput>,
    profile
      ? {
          name: profile.name,
          description: profile.description,
          permissionIds: profile.permissions.map((permission) => permission.id),
        }
      : EMPTY_VALUES,
    async (values) => saveAction?.(values, profile?.id),
    {
      message: t(profile ? 'accessControl.profiles.updated' : 'accessControl.profiles.created'),
      href: (id) => (id ? routes.view(Number(id)) : routes.list),
    },
  );

  const title =
    mode === 'create'
      ? t('accessControl.profiles.form.newTitle')
      : mode === 'edit'
        ? t('accessControl.profiles.form.editTitle')
        : (profile?.name ?? '');

  return (
    <FormCard
      containerTestId="profile-form-container"
      formTestId="profile-form"
      form={form}
      onSubmit={isView ? (event) => event.preventDefault() : onSubmit}
      header={
        <>
          <FormCardHeader
            title={title}
            titleTestId={isView ? 'profile-record-title' : 'profile-form-title'}
            {...(profile?.isSystem
              ? { description: t('accessControl.profiles.form.systemNote') }
              : {})}
            {...(isView && profile
              ? {
                  actions: (
                    <>
                      <Button variant="ghost" asChild data-testid="profile-record-button-back">
                        <Link href={routes.list}>{t('accessControl.profiles.record.back')}</Link>
                      </Button>
                      <Button asChild variant="edit" data-testid="profile-record-button-edit">
                        <Link href={routes.edit(profile.id)}>
                          <Pencil aria-hidden="true" />
                          {t('accessControl.profiles.record.edit')}
                        </Link>
                      </Button>
                    </>
                  ),
                }
              : {})}
          />
          <ProfileScopeNote product={product} />
        </>
      }
      {...(isView
        ? {}
        : {
            footer: (
              <FormCardActions
                isPending={isPending}
                saveLabel={t('accessControl.profiles.form.save')}
                saveTestId="profile-form-button-save"
                cancelHref={profile && mode === 'edit' ? routes.view(profile.id) : routes.list}
                cancelTestId="profile-form-button-cancel"
                cancelLabel={t('accessControl.profiles.form.cancel')}
              />
            ),
          })}
    >
      <ProfileFormFields
        product={product}
        permissions={permissions}
        code={profile?.id}
        disabled={isView}
      />
    </FormCard>
  );
}
