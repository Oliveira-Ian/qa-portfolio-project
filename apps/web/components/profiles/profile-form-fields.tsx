'use client';

import { useFormContext } from 'react-hook-form';
import { PRODUCT_LABELS, type PermissionDto, type ProfileWriteInput } from '@oliveira/schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useT } from '@/lib/i18n/provider';
import type { MessageKey } from '@/lib/i18n/translate';

interface ProfileFormFieldsProps {
  permissions: PermissionDto[];
  disabled?: boolean;
  /** The profile's number, read-only — omitted while it is being created, when it doesn't exist yet. */
  code?: number | undefined;
}

/** The four actions a screen's row can grant, in the order the matrix reads them. */
const MATRIX_ACTIONS = ['view', 'create', 'edit', 'delete'] as const;

type MatrixAction = (typeof MATRIX_ACTIONS)[number];

const ACTION_LABEL: Record<MatrixAction, MessageKey> = {
  view: 'erp.profiles.form.actions.view',
  create: 'erp.profiles.form.actions.create',
  edit: 'erp.profiles.form.actions.edit',
  delete: 'erp.profiles.form.actions.delete',
};

const GROUP_LABEL = {
  records: 'erp.profiles.form.groups.records',
  access: 'erp.profiles.form.groups.access',
  other: 'erp.profiles.form.groups.other',
} as const;

type MatrixGroup = keyof typeof GROUP_LABEL;

/** Which sidebar module a resource's screen lives under, so the matrix groups like the menu does. */
const RESOURCE_GROUP: Record<string, MatrixGroup> = { person: 'records', profile: 'access' };

const RESOURCE_LABEL: Record<string, MessageKey> = {
  person: 'erp.profiles.form.resources.person',
  profile: 'erp.profiles.form.resources.profile',
};

/** `resource:action` → the catalogue key of a permission's name; one the app doesn't know keeps the API's label. */
const PERMISSION_LABEL: Record<string, MessageKey> = {
  'profile:manage': 'erp.profiles.form.permissionLabels.profileManage',
};

function isMatrixAction(action: string): action is MatrixAction {
  return (MATRIX_ACTIONS as readonly string[]).includes(action);
}

/**
 * The permissions, laid out the way the design draws them (S16): a **screen ×
 * action** matrix — View, Create, Edit, Delete — grouped like the sidebar
 * (Records, Access). The catalogue (`PERMISSION_CATALOG`) is sealed and the API
 * serves it, so the matrix is built from the live list: a resource with a
 * `person:view` appears as a row, and a screen is added the day it has a
 * permission. A permission that isn't one of those four actions — `profile:manage`
 * says who may edit profiles at all — doesn't fit a cell and is listed below the
 * matrix on its own, rather than being squeezed under a column it doesn't mean.
 */
function PermissionsField({ permissions, disabled }: ProfileFormFieldsProps) {
  const t = useT();
  const form = useFormContext<ProfileWriteInput>();

  const byResource = new Map<string, PermissionDto[]>();

  for (const permission of permissions) {
    byResource.set(permission.resource, [
      ...(byResource.get(permission.resource) ?? []),
      permission,
    ]);
  }

  const matrixResources = [...byResource.entries()].filter(([, entries]) =>
    entries.some((entry) => isMatrixAction(entry.action)),
  );
  const special = permissions.filter((permission) => !isMatrixAction(permission.action));

  const groups = (['records', 'access', 'other'] as const)
    .map((group) => ({
      group,
      rows: matrixResources.filter(([resource]) => (RESOURCE_GROUP[resource] ?? 'other') === group),
    }))
    .filter(({ rows }) => rows.length > 0);

  return (
    <FormField
      control={form.control}
      name="permissionIds"
      render={({ field }) => {
        function toggle(permission: PermissionDto, checked: boolean) {
          field.onChange(
            checked
              ? [...field.value, permission.id]
              : field.value.filter((id: number) => id !== permission.id),
          );
        }

        return (
          <FormItem>
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <FormLabel data-testid="profile-form-label-permissions" className="text-lg">
                {t('erp.profiles.form.permissions')}
              </FormLabel>
              <p className="text-[13px] text-text-3">
                {t('erp.profiles.form.permissionsNote', { product: PRODUCT_LABELS.ERP })}
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-border">
              <Table data-testid="profile-form-permission-matrix">
                <TableHeader>
                  <TableRow className="h-10 hover:bg-transparent">
                    <TableHead>{t('erp.profiles.form.screen')}</TableHead>
                    {MATRIX_ACTIONS.map((action) => (
                      <TableHead key={action} className="w-24 text-center">
                        {t(ACTION_LABEL[action])}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map(({ group, rows }) => (
                    <GroupRows key={group} label={t(GROUP_LABEL[group])}>
                      {rows.map(([resource, entries]) => {
                        const screen = RESOURCE_LABEL[resource]
                          ? t(RESOURCE_LABEL[resource])
                          : resource;

                        return (
                          <TableRow key={resource}>
                            <TableCell className="pl-6 font-medium text-foreground">
                              {screen}
                            </TableCell>
                            {MATRIX_ACTIONS.map((action) => {
                              const permission = entries.find((entry) => entry.action === action);

                              return (
                                <TableCell key={action} className="text-center">
                                  {permission ? (
                                    <Checkbox
                                      checked={field.value.includes(permission.id)}
                                      disabled={disabled}
                                      aria-label={t('erp.profiles.form.selectColumn', {
                                        action: t(ACTION_LABEL[action]),
                                        screen,
                                      })}
                                      data-testid={`profile-form-checkbox-permission-${permission.resource}-${permission.action}`}
                                      onCheckedChange={(checked) =>
                                        toggle(permission, checked === true)
                                      }
                                    />
                                  ) : (
                                    <span aria-hidden="true" className="text-text-disabled">
                                      —
                                    </span>
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </GroupRows>
                  ))}
                </TableBody>
              </Table>
            </div>

            {special.length > 0 ? (
              <div className="mt-6">
                <h3 className="mb-2 text-base">{t('erp.profiles.form.special')}</h3>
                <div className="flex flex-col gap-1">
                  {special.map((permission) => {
                    const key = `${permission.resource}:${permission.action}`;

                    return (
                      <label
                        key={permission.id}
                        className="flex w-fit cursor-pointer items-center gap-2.5 py-1 text-sm text-foreground"
                      >
                        <Checkbox
                          checked={field.value.includes(permission.id)}
                          disabled={disabled}
                          data-testid={`profile-form-checkbox-permission-${permission.resource}-${permission.action}`}
                          onCheckedChange={(checked) => toggle(permission, checked === true)}
                        />
                        {PERMISSION_LABEL[key]
                          ? t(PERMISSION_LABEL[key])
                          : (permission.label ?? key)}
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <FormMessage data-testid="profile-form-error-permissions" />
          </FormItem>
        );
      }}
    />
  );
}

/** A mono overline row naming a group of screens, then the rows of that group. */
function GroupRows({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <TableRow className="h-10 bg-surface hover:bg-surface">
        <TableCell colSpan={5} className="olv-overline text-text-3">
          {label}
        </TableCell>
      </TableRow>
      {children}
    </>
  );
}

/** The note that says what this form is *not*: product access is the Platform's, permissions are the product's. */
export function ProfileScopeNote() {
  const t = useT();
  const product = PRODUCT_LABELS.ERP;

  return (
    <Alert variant="info" className="mb-5" data-testid="profile-form-scope-note">
      <AlertTitle>{t('erp.profiles.form.infoTitle', { product })}</AlertTitle>
      <AlertDescription>{t('erp.profiles.form.infoBody', { product })}</AlertDescription>
    </Alert>
  );
}

export function ProfileFormFields({ permissions, disabled = false, code }: ProfileFormFieldsProps) {
  const t = useT();
  const form = useFormContext<ProfileWriteInput>();

  return (
    <div className="flex flex-col gap-8 px-6 py-7">
      <div className="grid gap-5 sm:grid-cols-[9rem_minmax(0,1fr)]">
        <div className="grid gap-2">
          <FormLabel htmlFor="profile-form-input-code">{t('erp.profiles.form.code')}</FormLabel>
          <Input
            id="profile-form-input-code"
            readOnly
            tabIndex={-1}
            value={code === undefined ? t('erp.profiles.form.codeAuto') : String(code)}
            className="olv-data"
            data-testid="profile-form-input-code"
          />
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel data-testid="profile-form-label-name">
                {t('erp.profiles.form.name')}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled={disabled}
                  placeholder={t('erp.profiles.form.namePlaceholder')}
                  data-testid="profile-form-input-name"
                />
              </FormControl>
              <FormMessage data-testid="profile-form-error-name" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel data-testid="profile-form-label-description">
                {t('erp.profiles.form.description')}
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ''}
                  rows={2}
                  disabled={disabled}
                  placeholder={t('erp.profiles.form.descriptionPlaceholder')}
                  data-testid="profile-form-input-description"
                />
              </FormControl>
              <FormMessage data-testid="profile-form-error-description" />
            </FormItem>
          )}
        />
      </div>

      <PermissionsField permissions={permissions} disabled={disabled} />
    </div>
  );
}
