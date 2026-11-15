import { Contact, Database, KeyRound, Settings, Users, type LucideIcon } from 'lucide-react';
import type { PermissionKey } from '@oliveira/schemas';
import type { MessageKey } from '@/lib/i18n/translate';

/**
 * The Oliveira ERP's navigation catalog — sealed, like `PERMISSION_CATALOG`
 * (`packages/schemas/src/permissions.ts`), but four levels deep instead of one.
 * Every screen the ERP's sidebar, search and breadcrumb know about is a
 * `RoutineDefinition` somewhere in this tree. Growing the ERP means adding an
 * entry here (and the matching route folder); the sidebar, search index and
 * breadcrumb resolver need no changes.
 *
 * There is one catalogue per area (docs/adr/0019): this one is the ERP's, under
 * `/erp`. The Platform's few screens and the FSM's placeholder are described in
 * `nav.ts`. Labels are translation keys, never text — the language is a runtime
 * choice (docs/adr/0018's frontend, handoff § 7).
 */
export const ERP_BASE_PATH = '/erp';

export interface RoutineDefinition {
  slug: string;
  labelKey: MessageKey;
  icon: LucideIcon;
  /** Permission required, if any — checked against `MeResponse.permissions`. */
  permission?: PermissionKey;
}

export interface CategoryDefinition {
  slug: string;
  labelKey: MessageKey;
  routines: readonly RoutineDefinition[];
}

export interface GroupDefinition {
  slug: string;
  labelKey: MessageKey;
  icon: LucideIcon;
  categories: readonly CategoryDefinition[];
}

export interface ModuleDefinition {
  slug: string;
  labelKey: MessageKey;
  icon: LucideIcon;
  groups: readonly GroupDefinition[];
}

export const NAVIGATION_CATALOG = [
  {
    slug: 'records',
    labelKey: 'nav.erp.records',
    icon: Database,
    groups: [
      {
        slug: 'people',
        labelKey: 'nav.erp.people',
        icon: Contact,
        categories: [
          {
            slug: 'records',
            labelKey: 'nav.erp.records',
            routines: [
              {
                slug: 'people',
                labelKey: 'nav.erp.people',
                icon: Contact,
                permission: 'person:view',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'administration',
    labelKey: 'nav.erp.access',
    icon: Settings,
    groups: [
      {
        slug: 'access-control',
        labelKey: 'nav.erp.accessControl',
        icon: KeyRound,
        categories: [
          {
            slug: 'settings',
            labelKey: 'nav.erp.settings',
            routines: [
              {
                slug: 'profiles',
                labelKey: 'nav.erp.accessProfiles',
                icon: KeyRound,
                permission: 'profile:manage',
              },
              {
                slug: 'users',
                labelKey: 'nav.erp.users',
                icon: Users,
                permission: 'profile:manage',
              },
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
 * `href` is built from the area, then (module, group, routine) only — category
 * stays part of the ancestry but deliberately isn't a URL segment (ADR 0007), so
 * a routine's path doesn't repeat itself. This means `(module.slug, group.slug,
 * routine.slug)` must be unique across the whole catalog.
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
            href: buildHref(ERP_BASE_PATH.slice(1), catalogModule.slug, group.slug, routine.slug),
          });
        }
      }
    }
  }

  return flattened;
}

/** Access the caller's session carries — the same shape `lib/permissions.ts#getMe()` resolves. */
export interface AccessContext {
  permissions: readonly PermissionKey[];
}

function canSeeRoutine(routine: RoutineDefinition, access: AccessContext): boolean {
  return !routine.permission || access.permissions.includes(routine.permission);
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

/** The Module→Group→Category→Routine chain for the current URL, or `null` outside the ERP catalog (e.g. `/erp`). */
export function resolveBreadcrumb(pathname: string): RoutinePath | null {
  return (
    flattenRoutines().find(
      (entry) => pathname === entry.href || pathname.startsWith(`${entry.href}/`),
    ) ?? null
  );
}
