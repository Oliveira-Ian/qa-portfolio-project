import {
  Blocks,
  Building2,
  ClipboardList,
  Contact,
  Database,
  KeyRound,
  ListChecks,
  Package,
  Settings,
  ShieldCheck,
  Tags,
  UserCheck,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { ProductPermissionKey } from '@oliveira/schemas';
import type { MessageKey } from '@/lib/i18n/translate';

/**
 * The navigation catalogs of the products — sealed, like `PERMISSION_CATALOG`
 * (`packages/schemas/src/permissions.ts`), but four levels deep instead of one.
 * Every screen a product's sidebar, search and breadcrumb know about is a
 * `RoutineDefinition` somewhere in its tree. Growing a product means adding an
 * entry here (and the matching route folder); the sidebar, search index and
 * breadcrumb resolver need no changes.
 *
 * There is one catalog per area (docs/adr/0019), each under its own base path
 * (`/erp`, `/fsm`), each checked against that product's own permissions — a
 * routine of the FSM can only ask for an FSM permission. The Platform's few
 * screens are described in `nav.ts`. Labels are translation keys, never text.
 */
export type CatalogArea = 'ERP' | 'FSM';

export interface RoutineDefinition<P extends CatalogArea = CatalogArea> {
  slug: string;
  labelKey: MessageKey;
  icon: LucideIcon;
  /** The product permission required, if any — checked against `MeResponse.permissions[product]`. */
  permission?: ProductPermissionKey<P>;
  /** Several permissions, any of which is enough (e.g. "all work orders" or "my own"). */
  anyPermission?: readonly ProductPermissionKey<P>[];
}

export interface CategoryDefinition<P extends CatalogArea = CatalogArea> {
  slug: string;
  labelKey: MessageKey;
  routines: readonly RoutineDefinition<P>[];
}

export interface GroupDefinition<P extends CatalogArea = CatalogArea> {
  slug: string;
  labelKey: MessageKey;
  icon: LucideIcon;
  categories: readonly CategoryDefinition<P>[];
}

export interface ModuleDefinition<P extends CatalogArea = CatalogArea> {
  slug: string;
  labelKey: MessageKey;
  icon: LucideIcon;
  groups: readonly GroupDefinition<P>[];
}

const ERP_CATALOG = [
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
] as const satisfies readonly ModuleDefinition<'ERP'>[];

/**
 * Oliveira FSM (plan § 2.6). An entry here without its route folder would be a
 * link to a 404.
 */
const FSM_CATALOG = [
  {
    slug: 'operations',
    labelKey: 'nav.fsm.operations',
    icon: ClipboardList,
    groups: [
      {
        slug: 'work-orders',
        labelKey: 'nav.fsm.workOrders',
        icon: ClipboardList,
        categories: [
          {
            slug: 'operations',
            labelKey: 'nav.fsm.operations',
            routines: [
              {
                slug: 'work-orders',
                labelKey: 'nav.fsm.workOrders',
                icon: ClipboardList,
                permission: 'work-order:view',
              },
              {
                slug: 'my-work-orders',
                labelKey: 'nav.fsm.myWorkOrders',
                icon: UserCheck,
                permission: 'work-order:execute',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'records',
    labelKey: 'nav.fsm.records',
    icon: Database,
    groups: [
      {
        slug: 'customers',
        labelKey: 'nav.fsm.customers',
        icon: Contact,
        categories: [
          {
            slug: 'records',
            labelKey: 'nav.fsm.records',
            routines: [
              {
                slug: 'customers',
                labelKey: 'nav.fsm.customers',
                icon: Contact,
                permission: 'customer:view',
              },
              {
                slug: 'equipment',
                labelKey: 'nav.fsm.equipment',
                icon: Wrench,
                permission: 'equipment:view',
              },
            ],
          },
        ],
      },
      {
        slug: 'catalog',
        labelKey: 'nav.fsm.catalog',
        icon: Package,
        categories: [
          {
            slug: 'records',
            labelKey: 'nav.fsm.records',
            routines: [
              {
                slug: 'products-services',
                labelKey: 'nav.fsm.productsServices',
                icon: Package,
                permission: 'catalog-item:view',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'settings',
    labelKey: 'nav.fsm.settings',
    icon: Settings,
    groups: [
      {
        slug: 'work-orders',
        labelKey: 'nav.fsm.workOrders',
        icon: ClipboardList,
        categories: [
          {
            slug: 'settings',
            labelKey: 'nav.fsm.settings',
            routines: [
              {
                slug: 'work-order-types',
                labelKey: 'nav.fsm.workOrderTypes',
                icon: Tags,
                permission: 'work-order-type:manage',
              },
            ],
          },
        ],
      },
      {
        slug: 'company',
        labelKey: 'nav.fsm.company',
        icon: Building2,
        categories: [
          {
            slug: 'settings',
            labelKey: 'nav.fsm.settings',
            routines: [
              {
                slug: 'branches',
                labelKey: 'nav.fsm.branches',
                icon: Blocks,
                permission: 'branch:view',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'administration',
    labelKey: 'nav.fsm.access',
    icon: ShieldCheck,
    groups: [
      {
        slug: 'access-control',
        labelKey: 'nav.fsm.accessControl',
        icon: KeyRound,
        categories: [
          {
            slug: 'settings',
            labelKey: 'nav.fsm.settings',
            routines: [
              {
                slug: 'profiles',
                labelKey: 'nav.fsm.accessProfiles',
                icon: KeyRound,
                permission: 'profile:manage',
              },
              {
                slug: 'users',
                labelKey: 'nav.fsm.users',
                icon: ListChecks,
                permission: 'profile:manage',
              },
            ],
          },
        ],
      },
    ],
  },
] as const satisfies readonly ModuleDefinition<'FSM'>[];

export const AREA_CATALOGS: {
  [P in CatalogArea]: { basePath: string; modules: readonly ModuleDefinition<P>[] };
} = {
  ERP: { basePath: '/erp', modules: ERP_CATALOG },
  FSM: { basePath: '/fsm', modules: FSM_CATALOG },
};

/** The literal URL segments a routine's ancestors contribute, in order. */
export interface RoutinePath {
  area: CatalogArea;
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
 * Every routine of `area` (or of the `modules` given, e.g. already filtered by
 * `filterCatalogForAccount`), flattened with its full ancestry — the shape both
 * search and breadcrumb resolution need.
 *
 * `href` is built from the area, then (module, group, routine) only — category
 * stays part of the ancestry but deliberately isn't a URL segment (ADR 0007), so
 * `(module.slug, group.slug, routine.slug)` must be unique within an area.
 */
export function flattenRoutines(
  area: CatalogArea,
  modules: readonly ModuleDefinition[] = AREA_CATALOGS[area].modules,
): RoutinePath[] {
  const base = AREA_CATALOGS[area].basePath.slice(1);
  const flattened: RoutinePath[] = [];

  for (const catalogModule of modules) {
    for (const group of catalogModule.groups) {
      for (const category of group.categories) {
        for (const routine of category.routines) {
          flattened.push({
            area,
            module: catalogModule,
            group,
            category,
            routine,
            href: buildHref(base, catalogModule.slug, group.slug, routine.slug),
          });
        }
      }
    }
  }

  return flattened;
}

function canSeeRoutine(routine: RoutineDefinition, permissions: readonly string[]): boolean {
  if (routine.anyPermission) {
    return routine.anyPermission.some((key) => permissions.includes(key));
  }

  return !routine.permission || permissions.includes(routine.permission);
}

/**
 * Prunes an area's catalog down to what this account can reach with its
 * permissions in that product — a module/group/category with zero visible
 * routines underneath it is dropped rather than rendered as an empty shell.
 */
export function filterCatalogForAccount(
  area: CatalogArea,
  permissions: readonly string[],
): ModuleDefinition[] {
  const modules: ModuleDefinition[] = [];

  for (const catalogModule of AREA_CATALOGS[area].modules as readonly ModuleDefinition[]) {
    const groups: GroupDefinition[] = [];

    for (const group of catalogModule.groups) {
      const categories: CategoryDefinition[] = [];

      for (const category of group.categories) {
        const routines = category.routines.filter((routine) => canSeeRoutine(routine, permissions));

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

/** The Module→Group→Category→Routine chain for the current URL, or `null` outside the area's catalog (e.g. `/erp`). */
export function resolveBreadcrumb(area: CatalogArea, pathname: string): RoutinePath | null {
  return (
    flattenRoutines(area).find(
      (entry) => pathname === entry.href || pathname.startsWith(`${entry.href}/`),
    ) ?? null
  );
}
