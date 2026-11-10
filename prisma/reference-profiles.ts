import {
  PERMISSION_CATALOG,
  SEED_PROFILE_NAMES,
  permissionKey,
  type Product,
} from '@oliveira/schemas';
import type { PrismaClient } from '../apps/api/src/generated/prisma/client.js';

/**
 * The reference profiles of each product: data copied into a company when it
 * contracts the product (docs/adr/0011, "a template is data"). After the copy
 * they are the company's: it edits, duplicates and adds to them. Provisioning
 * runs through a client that bypasses row-level security (the seed's, later the
 * Oliveira console's), since it writes into a company that is not the caller's.
 */

interface ReferenceProfile {
  name: string;
  description: string;
  /** Protected from deletion. */
  isSystem: boolean;
  /** Linked to a member the first time they get a seat in the product. Never administrative. */
  isDefault: boolean;
  /** `"resource:action"` keys of the product's catalog. */
  permissions: readonly string[];
}

const keysOf = (product: Product) =>
  PERMISSION_CATALOG[product].map((entry) => permissionKey(entry.resource, entry.action));

export const REFERENCE_PROFILES: Record<Product, readonly ReferenceProfile[]> = {
  ERP: [
    {
      name: SEED_PROFILE_NAMES.ADMINISTRATOR,
      description: 'Full access to every permission of the ERP.',
      isSystem: true,
      isDefault: false,
      permissions: keysOf('ERP'),
    },
    {
      name: SEED_PROFILE_NAMES.MANAGER,
      description: 'Day-to-day operation: can view, create and edit, but not delete.',
      isSystem: false,
      isDefault: false,
      permissions: ['person:view', 'person:create', 'person:edit'],
    },
    {
      name: SEED_PROFILE_NAMES.FINANCE,
      description: 'Read access for billing and collections work.',
      isSystem: false,
      isDefault: false,
      permissions: ['person:view'],
    },
    {
      name: SEED_PROFILE_NAMES.CASHIER,
      description: 'Read access at the point of sale.',
      isSystem: false,
      isDefault: false,
      permissions: ['person:view'],
    },
    {
      name: SEED_PROFILE_NAMES.DEFAULT_USER,
      description: 'Linked to a member the first time they are granted a seat in the ERP.',
      isSystem: true,
      isDefault: true,
      permissions: ['person:view'],
    },
  ],
  FSM: [
    {
      name: SEED_PROFILE_NAMES.ADMINISTRATOR,
      description: 'Full access to every permission of the FSM, including its profiles.',
      isSystem: true,
      isDefault: false,
      permissions: keysOf('FSM'),
    },
    {
      name: SEED_PROFILE_NAMES.MANAGER,
      description:
        'Runs the operation: registers customers and equipment, opens, assigns and follows work orders.',
      isSystem: false,
      isDefault: false,
      permissions: keysOf('FSM').filter((key) => key !== 'profile:manage'),
    },
    {
      name: SEED_PROFILE_NAMES.TECHNICIAN,
      description:
        'Works in the field: sees customers and equipment, executes the work orders assigned to them.',
      isSystem: true,
      isDefault: true,
      permissions: [
        'customer:view',
        'equipment:view',
        'catalog-item:view',
        'work-order:execute',
        'dashboard:view',
      ],
    },
  ],
};

/** Upserts the product's catalog; returns permission ids by key. */
export async function seedPermissionCatalog(
  prisma: PrismaClient,
  product: Product,
): Promise<Map<string, number>> {
  const idByKey = new Map<string, number>();

  for (const entry of PERMISSION_CATALOG[product]) {
    const row = await prisma.permission.upsert({
      where: {
        product_resource_action: { product, resource: entry.resource, action: entry.action },
      },
      update: { label: entry.label },
      create: { product, resource: entry.resource, action: entry.action, label: entry.label },
    });

    idByKey.set(permissionKey(entry.resource, entry.action), row.id);
  }

  return idByKey;
}

/**
 * Copies the product's reference profiles into the company. Safe to re-run:
 * a profile the company already has (by name) keeps whatever the company made of
 * it — except that a protected Administrator gains any permission the catalog
 * added since, so it stays the profile that can do everything. Returns the
 * company's profile ids by name.
 */
export async function provisionProductProfiles(
  prisma: PrismaClient,
  companyId: string,
  product: Product,
  permissionIdByKey: Map<string, number>,
): Promise<Map<string, number>> {
  const idByName = new Map<string, number>();

  for (const reference of REFERENCE_PROFILES[product]) {
    const permissionIds = reference.permissions.map((key) => {
      const id = permissionIdByKey.get(key);

      if (id === undefined) {
        throw new Error(`${product} profile "${reference.name}" references unknown "${key}"`);
      }

      return id;
    });

    const existing = await prisma.accessProfile.findUnique({
      where: { companyId_product_name: { companyId, product, name: reference.name } },
    });

    if (existing) {
      if (
        reference.isSystem &&
        reference.permissions.length === PERMISSION_CATALOG[product].length
      ) {
        await prisma.profilePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            companyId,
            profileId: existing.id,
            permissionId,
          })),
          skipDuplicates: true,
        });
      }

      idByName.set(reference.name, existing.id);
      continue;
    }

    const created = await prisma.accessProfile.create({
      data: {
        companyId,
        product,
        name: reference.name,
        description: reference.description,
        isSystem: reference.isSystem,
        isDefault: reference.isDefault,
        permissions: { create: permissionIds.map((permissionId) => ({ permissionId })) },
      },
    });

    idByName.set(reference.name, created.id);
  }

  return idByName;
}
