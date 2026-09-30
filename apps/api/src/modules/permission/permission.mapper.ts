import type { Permission } from '../../generated/prisma/client.js';
import type { PermissionDto } from '@oliveira/schemas';

export function toPermissionDto(row: Permission): PermissionDto {
  return { id: row.id, resource: row.resource, action: row.action, label: row.label };
}
