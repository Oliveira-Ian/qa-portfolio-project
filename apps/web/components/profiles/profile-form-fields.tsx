'use client';

import { useFormContext } from 'react-hook-form';
import type { PermissionDto, ProfileWriteInput } from '@oliveira/schemas';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface ProfileFormFieldsProps {
  permissions: PermissionDto[];
  disabled?: boolean;
}

function groupByResource(permissions: PermissionDto[]): Map<string, PermissionDto[]> {
  const grouped = new Map<string, PermissionDto[]>();

  for (const permission of permissions) {
    const existing = grouped.get(permission.resource);

    if (existing) {
      existing.push(permission);
    } else {
      grouped.set(permission.resource, [permission]);
    }
  }

  return grouped;
}

/**
 * The permission picker groups the live catalog by resource — one fieldset
 * per module ("person", …) — rather than a flat list, so a profile with
 * dozens of permissions across many future modules stays scannable.
 */
function PermissionsField({ permissions, disabled }: ProfileFormFieldsProps) {
  const form = useFormContext<ProfileWriteInput>();
  const grouped = groupByResource(permissions);

  return (
    <FormField
      control={form.control}
      name="permissionIds"
      render={({ field }) => (
        <FormItem>
          <FormLabel data-testid="profile-form-label-permissions">Permissions</FormLabel>
          <div className="flex flex-col gap-5">
            {[...grouped.entries()].map(([resource, entries]) => (
              <fieldset key={resource} className="min-w-0">
                <legend className="eyebrow text-muted-foreground capitalize">{resource}</legend>
                <div className="measured-rule mt-2 mb-3" aria-hidden="true" />
                <div className="grid gap-2 sm:grid-cols-2">
                  {entries.map((permission) => (
                    <label
                      key={permission.id}
                      className="flex cursor-pointer items-center gap-2 py-1 text-sm text-foreground"
                    >
                      <Checkbox
                        checked={field.value.includes(permission.id)}
                        disabled={disabled}
                        data-testid={`profile-form-checkbox-permission-${permission.resource}-${permission.action}`}
                        onCheckedChange={(checked) => {
                          field.onChange(
                            checked === true
                              ? [...field.value, permission.id]
                              : field.value.filter((id: number) => id !== permission.id),
                          );
                        }}
                      />
                      {permission.label ?? `${permission.resource}:${permission.action}`}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          <FormMessage data-testid="profile-form-error-permissions" />
        </FormItem>
      )}
    />
  );
}

export function ProfileFormFields({ permissions, disabled = false }: ProfileFormFieldsProps) {
  const form = useFormContext<ProfileWriteInput>();

  return (
    <div className="flex flex-col gap-6">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel data-testid="profile-form-label-name">Name</FormLabel>
            <FormControl>
              <Input
                {...field}
                disabled={disabled}
                placeholder="Financeiro"
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
          <FormItem>
            <FormLabel data-testid="profile-form-label-description">Description</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value ?? ''}
                rows={2}
                disabled={disabled}
                placeholder="What this profile is for…"
                data-testid="profile-form-input-description"
              />
            </FormControl>
            <FormMessage data-testid="profile-form-error-description" />
          </FormItem>
        )}
      />

      <PermissionsField permissions={permissions} disabled={disabled} />
    </div>
  );
}
