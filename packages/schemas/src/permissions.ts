/**
 * The permission catalog — sealed on purpose. Nothing in the product lets a
 * user invent a permission; the UI only attaches entries from this list to a
 * profile. A permission that exists in the database but isn't checked
 * anywhere in code is worse than no permission at all, so the catalog and the
 * code that enforces it are meant to be edited together.
 *
 * Adding a new module (Products, Service Orders, …) means adding its entries
 * here, then re-running `prisma/seed.ts` — the authorization engine
 * (`requirePermission()`) and the admin UI need no changes; only the catalog
 * grows.
 */
export interface PermissionDefinition {
  resource: string;
  action: string;
  label: string;
}

export const PERMISSION_CATALOG = [
  { resource: 'person', action: 'view', label: 'View people' },
  { resource: 'person', action: 'create', label: 'Create people' },
  { resource: 'person', action: 'edit', label: 'Edit people' },
  { resource: 'person', action: 'delete', label: 'Delete people' },
] as const satisfies readonly PermissionDefinition[];

export type PermissionEntry = (typeof PERMISSION_CATALOG)[number];
export type PermissionResource = PermissionEntry['resource'];
export type PermissionAction = PermissionEntry['action'];

/** `"person:view"`, `"person:create"`, … — autocompletes from the catalog above. */
export type PermissionKey = `${PermissionEntry['resource']}:${PermissionEntry['action']}`;

export function permissionKey(resource: string, action: string): string {
  return `${resource}:${action}`;
}

export const PERMISSION_KEYS: readonly PermissionKey[] = PERMISSION_CATALOG.map(
  (entry) => permissionKey(entry.resource, entry.action) as PermissionKey,
);

/** Every permission a resource has, grouped for a UI that lists by resource. */
export function permissionsByResource(): Map<string, PermissionEntry[]> {
  const grouped = new Map<string, PermissionEntry[]>();

  for (const entry of PERMISSION_CATALOG) {
    const existing = grouped.get(entry.resource);

    if (existing) {
      existing.push(entry);
    } else {
      grouped.set(entry.resource, [entry]);
    }
  }

  return grouped;
}

/**
 * Names of the profiles the system seeds out of the box. `ADMINISTRATOR` and
 * `DEFAULT_USER` are `isSystem` (protected from deletion) — the others are
 * ordinary starting points a company is expected to edit or replace.
 */
export const SEED_PROFILE_NAMES = {
  ADMINISTRATOR: 'Administrator',
  MANAGER: 'Manager',
  FINANCE: 'Finance',
  CASHIER: 'Cashier',
  DEFAULT_USER: 'Default User',
} as const;
