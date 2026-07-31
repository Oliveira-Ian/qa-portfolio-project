import {
  Contact,
  Database,
  KeyRound,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { PermissionKey } from '@oliveira/schemas';

/**
 * The navigation catalog — sealed, like `PERMISSION_CATALOG`
 * (`packages/schemas/src/permissions.ts`), but four levels deep instead of
 * one. Nothing renders a menu item, a URL, or a breadcrumb from anywhere
 * else — every screen the sidebar, the search, and the routing layer know
 * about is a `RoutineDefinition` somewhere in this tree. Growing the system
 * means adding an entry here (and the matching route folder); the sidebar,
 * search index, and breadcrumb resolver need no changes.
 */
export interface RoutineDefinition {
  slug: string;
  label: string;
  icon: LucideIcon;
  /** Business permission required, if any — checked against `MeResponse.permissions`. */
  permission?: PermissionKey;
  /** Technical-role gate — mirrors the API's `requireRole('ADMIN')` routes. */
  adminOnly?: boolean;
}

export interface CategoryDefinition {
  slug: string;
  label: string;
  routines: readonly RoutineDefinition[];
}

export interface GroupDefinition {
  slug: string;
  label: string;
  icon: LucideIcon;
  categories: readonly CategoryDefinition[];
}

export interface ModuleDefinition {
  slug: string;
  label: string;
  icon: LucideIcon;
  groups: readonly GroupDefinition[];
}

export const NAVIGATION_CATALOG = [
  {
    slug: 'records',
    label: 'Records',
    icon: Database,
    groups: [
      {
        slug: 'people',
        label: 'People',
        icon: Contact,
        categories: [
          {
            slug: 'records',
            label: 'Records',
            routines: [
              { slug: 'people', label: 'People', icon: Contact, permission: 'person:view' },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'administration',
    label: 'Administration',
    icon: Settings,
    groups: [
      {
        slug: 'access-control',
        label: 'Access Control',
        icon: ShieldCheck,
        categories: [
          {
            slug: 'settings',
            label: 'Settings',
            routines: [
              { slug: 'profiles', label: 'Profiles', icon: KeyRound, adminOnly: true },
              { slug: 'users', label: 'Users', icon: Users, adminOnly: true },
            ],
          },
        ],
      },
    ],
  },
] as const satisfies readonly ModuleDefinition[];

/** The literal URL segments a routine's ancestors contribute, in order. */
export interface RoutinePath {
  module: ModuleDefinition;
  group: GroupDefinition;
  category: CategoryDefinition;
  routine: RoutineDefinition;
  href: string;
}

/** Joins URL segments into a path — exported so nothing else re-derives a routine's href by hand. */
export function buildHref(...slugs: string[]): string {
  return `/${slugs.join('/')}`;
}

/**
 * Every routine in `modules`, flattened with its full ancestry — the shape
 * both search and breadcrumb resolution need. Defaults to the whole sealed
 * catalog; pass the result of `filterCatalogForAccount()` to flatten only
 * what the caller can actually see.
 *
 * `href` is built from (module, group, routine) only — category stays part of
 * the ancestry (sidebar flyout, breadcrumb segment) but deliberately isn't a
 * URL segment, so a routine's path doesn't repeat itself the way
 * `/records/people/records/people` used to. This means `(module.slug,
 * group.slug, routine.slug)` must be unique across the whole catalog — two
 * routines with the same slug in the same group, even under different
 * categories, would collide on one URL.
 */
export function flattenRoutines(
  modules: readonly ModuleDefinition[] = NAVIGATION_CATALOG,
): RoutinePath[] {
  const flattened: RoutinePath[] = [];

  for (const catalogModule of modules) {
    for (const group of catalogModule.groups) {
      for (const category of group.categories) {
        for (const routine of category.routines) {
          flattened.push({
            module: catalogModule,
            group,
            category,
            routine,
            href: buildHref(catalogModule.slug, group.slug, routine.slug),
          });
        }
      }
    }
  }

  return flattened;
}

/** Access the caller's session carries — the same shape `lib/permissions.ts#getMe()` resolves. */
export interface AccessContext {
  isAdmin: boolean;
  permissions: readonly PermissionKey[];
}

function canSeeRoutine(routine: RoutineDefinition, access: AccessContext): boolean {
  if (routine.adminOnly && !access.isAdmin) {
    return false;
  }

  if (routine.permission && !access.isAdmin && !access.permissions.includes(routine.permission)) {
    return false;
  }

  return true;
}

/**
 * Prunes the catalog down to what this account can actually reach — a
 * module/group/category with zero visible routines underneath it is dropped
 * entirely rather than rendered as an empty shell.
 */
export function filterCatalogForAccount(access: AccessContext): ModuleDefinition[] {
  const modules: ModuleDefinition[] = [];

  for (const catalogModule of NAVIGATION_CATALOG) {
    const groups: GroupDefinition[] = [];

    for (const group of catalogModule.groups) {
      const categories: CategoryDefinition[] = [];

      for (const category of group.categories) {
        const routines = category.routines.filter((routine) => canSeeRoutine(routine, access));

        if (routines.length > 0) {
          categories.push({ ...category, routines });
        }
      }

      if (categories.length > 0) {
        groups.push({ ...group, categories });
      }
    }

    if (groups.length > 0) {
      modules.push({ ...catalogModule, groups });
    }
  }

  return modules;
}

/** The Module→Group→Category→Routine chain for the current URL, or `null` outside the catalog (e.g. `/home`). */
export function resolveBreadcrumb(pathname: string): RoutinePath | null {
  return (
    flattenRoutines().find(
      (entry) => pathname === entry.href || pathname.startsWith(`${entry.href}/`),
    ) ?? null
  );
}
