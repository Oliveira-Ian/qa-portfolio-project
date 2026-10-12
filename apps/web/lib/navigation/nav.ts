import { Building2, Home, LayoutDashboard, Users, Blocks, type LucideIcon } from 'lucide-react';
import type { PermissionKey, Product } from '@oliveira/schemas';
import type { MessageKey } from '@/lib/i18n/translate';
import { filterCatalogForAccount, flattenRoutines, type RoutinePath } from './catalog';
import { ROUTES } from './routes';

/**
 * What a product's sidebar shows. The Platform owns the global bar and the
 * product switcher (identical everywhere); each area owns its own sidebar
 * (handoff § 5). Everything here is plain data — icons are component
 * references, so this is computed inside the client tree, never passed from a
 * Server Component.
 */
export type AreaKey = 'platform' | Product;

/** The URL prefix of each area's own screens. `platform` has none: its routes are `/home` and `/company/…`. */
export const AREA_HOME: Record<AreaKey, string> = {
  platform: ROUTES.home,
  ERP: ROUTES.erp.home,
  FSM: ROUTES.fsm.home,
};

export interface NavItem {
  href: string;
  labelKey: MessageKey;
  icon: LucideIcon;
  testId: string;
  /** Active on exactly this path, not on its children — for an area's own home. */
  exact?: boolean;
}

export interface NavSection {
  id: string;
  /** The mono overline above the items; none for the first, unlabeled group. */
  labelKey?: MessageKey;
  items: NavItem[];
}

export interface NavAccess {
  permissions: readonly PermissionKey[];
  isCompanyAdmin: boolean;
}

/**
 * Items without the View permission are hidden; a direct link to one still
 * lands on the in-product "You can't view …" page (handoff § 5), because the
 * API — not this menu — is what refuses.
 */
export function buildNavigation(area: AreaKey, access: NavAccess): NavSection[] {
  if (area === 'platform') {
    const sections: NavSection[] = [
      {
        id: 'platform',
        items: [
          {
            href: ROUTES.home,
            labelKey: 'nav.platform.home',
            icon: Home,
            testId: 'nav-home',
            exact: true,
          },
        ],
      },
    ];

    if (access.isCompanyAdmin) {
      sections.push({
        id: 'company-admin',
        labelKey: 'nav.platform.companyAdmin',
        items: [
          {
            href: ROUTES.company.overview,
            labelKey: 'nav.platform.company',
            icon: Building2,
            testId: 'nav-company',
            exact: true,
          },
          {
            href: ROUTES.company.members,
            labelKey: 'nav.platform.members',
            icon: Users,
            testId: 'nav-members',
          },
          {
            href: ROUTES.company.productAccess(),
            labelKey: 'nav.platform.productAccess',
            icon: Blocks,
            testId: 'nav-product-access',
          },
        ],
      });
    }

    return sections;
  }

  if (area === 'ERP') {
    const sections: NavSection[] = [
      {
        id: 'erp-home',
        items: [
          {
            href: ROUTES.erp.home,
            labelKey: 'nav.erp.overview',
            icon: LayoutDashboard,
            testId: 'nav-erp-overview',
            exact: true,
          },
        ],
      },
    ];

    // The catalog is hierarchical (Module → Group → Category → Routine, ADR 0007);
    // the sidebar shows a Module as an overline and its routines as items.
    for (const catalogModule of filterCatalogForAccount({ permissions: access.permissions })) {
      const routines = flattenRoutines([catalogModule]);

      sections.push({
        id: `erp-${catalogModule.slug}`,
        labelKey: catalogModule.labelKey,
        items: routines.map((entry) => ({
          href: entry.href,
          labelKey: entry.routine.labelKey,
          icon: entry.routine.icon,
          testId: `nav-erp-${entry.module.slug}-${entry.routine.slug}`,
        })),
      });
    }

    return sections;
  }

  // Oliveira FSM is a placeholder: no modules yet, so no sidebar items.
  return [];
}

/** One searchable screen of the current area. */
export interface SearchEntry {
  href: string;
  labelKey: MessageKey;
  /** The section it belongs to, shown dimmed beside the label. */
  contextKey: MessageKey | null;
  icon: LucideIcon;
}

export function buildSearchEntries(sections: readonly NavSection[]): SearchEntry[] {
  return sections.flatMap((section) =>
    section.items.map((item) => ({
      href: item.href,
      labelKey: item.labelKey,
      contextKey: section.labelKey ?? null,
      icon: item.icon,
    })),
  );
}

export type { RoutinePath };
