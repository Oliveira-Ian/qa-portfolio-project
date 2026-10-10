'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useT } from '@/lib/i18n/provider';
import type { MessageKey } from '@/lib/i18n/translate';
import { resolveBreadcrumb } from '@/lib/navigation/catalog';
import type { AreaKey } from '@/lib/navigation/nav';
import { ROUTES } from '@/lib/navigation/routes';
import { AREA_HOME } from '@/lib/navigation/nav';
import { areaName } from '@/lib/products';

interface Crumb {
  label: string;
  href?: string;
  /** Translated by the trail; product names arrive already written and are never translated. */
  current?: boolean;
}

/**
 * The trail at the top of the page (handoff § 5): the product first, never a
 * repeated segment — the old ERP trail read "Records › People › Records ›
 * People". Every level is plain text except the ones that are real pages, and
 * the last is the current page (`aria-current`).
 *
 * It derives the trail from the URL and the area's own structure: the ERP's
 * from its catalogue, the Platform's company administration from a short table.
 * A record's page adds "Details", "New" or "Edit".
 */
export function Breadcrumbs({ area }: { area: AreaKey }) {
  const t = useT();
  const pathname = usePathname();
  const crumbs = buildCrumbs(area, pathname, t);

  if (crumbs.length < 2) {
    return null;
  }

  return (
    <Breadcrumb className="mb-4" data-testid="breadcrumb-trail">
      <BreadcrumbList>
        {crumbs.map((crumb, index) => (
          <Fragment key={`${crumb.label}-${index}`}>
            {index > 0 ? <BreadcrumbSeparator /> : null}
            <BreadcrumbItem>
              {crumb.current ? (
                <BreadcrumbPage data-testid="breadcrumb-current">{crumb.label}</BreadcrumbPage>
              ) : crumb.href ? (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              ) : (
                crumb.label
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function buildCrumbs(area: AreaKey, pathname: string, t: (key: MessageKey) => string): Crumb[] {
  const root: Crumb = { label: areaName(area), href: AREA_HOME[area] };

  if (area === 'platform') {
    const companyAdmin: Crumb = {
      label: t('nav.platform.companyAdmin'),
      href: ROUTES.company.overview,
    };

    if (pathname.startsWith(ROUTES.company.members)) {
      return [root, companyAdmin, { label: t('nav.platform.members'), current: true }];
    }

    if (pathname.startsWith(ROUTES.company.productAccess())) {
      return [root, companyAdmin, { label: t('nav.platform.productAccess'), current: true }];
    }

    if (pathname.startsWith(ROUTES.company.overview)) {
      return [root, { label: companyAdmin.label, current: true }];
    }

    return [];
  }

  if (area === 'ERP') {
    const entry = resolveBreadcrumb(pathname);

    if (!entry) {
      return [];
    }

    const rest = pathname.slice(entry.href.length).split('/').filter(Boolean);
    const tail = rest.at(-1);
    const tailLabel: string | null =
      tail === undefined
        ? null
        : tail === 'new'
          ? t('breadcrumb.new')
          : tail === 'edit'
            ? t('breadcrumb.edit')
            : t('breadcrumb.details');

    return [
      root,
      { label: t(entry.module.labelKey) },
      tailLabel === null
        ? { label: t(entry.routine.labelKey), current: true }
        : { label: t(entry.routine.labelKey), href: entry.href },
      ...(tailLabel === null ? [] : [{ label: tailLabel, current: true }]),
    ];
  }

  return [];
}
