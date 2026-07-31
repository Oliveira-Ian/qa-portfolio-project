import type { AccessProfile, Permission, ProfilePermission } from '@prisma/client';
import type { ProfileDto } from '@oliveira/schemas';
import { toPermissionDto } from '../permission/permission.mapper.js';

type ProfileRow = AccessProfile & {
  permissions: (ProfilePermission & { permission: Permission })[];
};

export function toProfileDto(row: ProfileRow): ProfileDto {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isSystem: row.isSystem,
    isDefault: row.isDefault,
    permissions: row.permissions.map((link) => toPermissionDto(link.permission)),
  };
}
