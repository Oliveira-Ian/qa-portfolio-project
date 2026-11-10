import type { Product } from './platform.js';

/**
 * The permission catalog — sealed on purpose, one section per product
 * (docs/adr/0018). A product's profiles only ever hold that product's
 * permissions; the ERP's and the FSM's never mix.
 *
 * Nothing in the product lets a user invent a permission; the UI only attaches
 * entries from this list to a profile. A permission that exists in the database
 * but isn't checked anywhere in code is worse than no permission at all, so the
 * catalog and the code that enforces it are meant to be edited together.
 *
 * Adding a permission means adding its entry here, then re-running
 * `prisma/seed.ts` — `requirePermission()` and the profile editor need no
 * changes; only the catalog grows.
 */
export interface PermissionDefinition {
  resource: string;
  action: string;
  label: string;
}

export const PERMISSION_CATALOG = {
  ERP: [
    { resource: 'person', action: 'view', label: 'View people' },
    { resource: 'person', action: 'create', label: 'Create people' },
    { resource: 'person', action: 'edit', label: 'Edit people' },
    { resource: 'person', action: 'delete', label: 'Delete people' },
    { resource: 'profile', action: 'manage', label: 'Manage profiles and their access' },
  ],
  FSM: [
    { resource: 'customer', action: 'view', label: 'View customers' },
    { resource: 'customer', action: 'create', label: 'Create customers' },
    { resource: 'customer', action: 'edit', label: 'Edit customers' },
    { resource: 'customer', action: 'delete', label: 'Delete customers' },
    { resource: 'equipment', action: 'view', label: 'View equipment' },
    { resource: 'equipment', action: 'create', label: 'Create equipment' },
    { resource: 'equipment', action: 'edit', label: 'Edit equipment' },
    { resource: 'equipment', action: 'delete', label: 'Delete equipment' },
    { resource: 'catalog-item', action: 'view', label: 'View products and services' },
    { resource: 'catalog-item', action: 'create', label: 'Create products and services' },
    { resource: 'catalog-item', action: 'edit', label: 'Edit products and services' },
    { resource: 'catalog-item', action: 'delete', label: 'Delete products and services' },
    { resource: 'work-order-type', action: 'manage', label: 'Manage work order types' },
    { resource: 'work-order', action: 'view', label: 'View every work order' },
    { resource: 'work-order', action: 'create', label: 'Create work orders' },
    { resource: 'work-order', action: 'edit', label: 'Edit work orders' },
    { resource: 'work-order', action: 'assign', label: 'Assign work orders to technicians' },
    {
      resource: 'work-order',
      action: 'change-status',
      label: 'Schedule, put on hold and cancel work orders',
    },
    {
      resource: 'work-order',
      action: 'execute',
      label: 'Start, record and complete the work orders assigned to them',
    },
    { resource: 'dashboard', action: 'view', label: 'View the operations dashboard' },
    { resource: 'profile', action: 'manage', label: 'Manage profiles and their access' },
  ],
} as const satisfies Record<Product, readonly PermissionDefinition[]>;

type KeyOf<Entry> = Entry extends {
  resource: infer R extends string;
  action: infer A extends string;
}
  ? `${R}:${A}`
  : never;

/** `"person:view"`, … — the ERP's keys, autocompleted from the catalog above. */
export type ErpPermissionKey = KeyOf<(typeof PERMISSION_CATALOG)['ERP'][number]>;
/** `"work-order:assign"`, … — the FSM's keys. */
export type FsmPermissionKey = KeyOf<(typeof PERMISSION_CATALOG)['FSM'][number]>;

/** The keys of one product — what `requirePermission(product, key)` and `can(product, key)` accept. */
export type ProductPermissionKey<P extends Product> = P extends 'ERP'
  ? ErpPermissionKey
  : P extends 'FSM'
    ? FsmPermissionKey
    : never;

export type PermissionKey = ErpPermissionKey | FsmPermissionKey;

/** What a caller may do in each product — empty for a product they hold no seat in. */
export type ProductPermissions = { [P in Product]: ProductPermissionKey<P>[] };

export type PermissionEntry = (typeof PERMISSION_CATALOG)[Product][number];

export function permissionKey(resource: string, action: string): string {
  return `${resource}:${action}`;
}

/** Every permission a product's resource has, grouped for a UI that lists by resource. */
export function permissionsByResource(product: Product): Map<string, PermissionEntry[]> {
  const grouped = new Map<string, PermissionEntry[]>();

  for (const entry of PERMISSION_CATALOG[product]) {
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
 * Names of the reference profiles copied into a company when it contracts a
 * product (`prisma/reference-profiles.ts`). Names are per product, so the ERP
 * and the FSM each have their own "Administrator".
 */
export const SEED_PROFILE_NAMES = {
  ADMINISTRATOR: 'Administrator',
  MANAGER: 'Manager',
  FINANCE: 'Finance',
  CASHIER: 'Cashier',
  DEFAULT_USER: 'Default User',
  TECHNICIAN: 'Technician',
} as const;
