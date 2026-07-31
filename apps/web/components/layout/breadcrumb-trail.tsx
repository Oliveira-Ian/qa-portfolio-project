'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { resolveBreadcrumb } from '@/lib/navigation/catalog';

/**
 * Home > Module > Group > Category > Routine. Only "Home" and the current
 * Routine are real links — the levels between them don't have a page of their
 * own (a Module or Category isn't a route, just a grouping the sidebar
 * drills through), so they render as plain text.
 *
 * Renders nothing outside the catalog (e.g. `/home`) — there's no meaningful
 * trail to show for a page the hierarchy doesn't model.
 */
export function BreadcrumbTrail() {
  const pathname = usePathname();
  const entry = resolveBreadcrumb(pathname);

  if (!entry) {
    return null;
  }

  return (
    <Breadcrumb className="mb-4" data-testid="breadcrumb-trail">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild data-testid="breadcrumb-home">
            <Link href="/home">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>{entry.module.label}</BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>{entry.group.label}</BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>{entry.category.label}</BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage data-testid="breadcrumb-current">{entry.routine.label}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
