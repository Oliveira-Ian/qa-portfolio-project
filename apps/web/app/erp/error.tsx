'use client';

import { ErrorPanel } from '@/components/platform/error-panel';

/**
 * The ERP's boundary — placed below `erp/layout.tsx`, so a failure inside a page
 * (e.g. `PeoplePage`'s `listPersons()` throwing when the API is down) only
 * replaces the content slot. The global bar, sidebar and breadcrumb stay exactly
 * as they were, so a reader who hit this on the People grid can still get to
 * another screen without a hard reload. `app/error.tsx` (the root boundary)
 * catches anything above the layout itself.
 */
export default function ErpErrorBoundary(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPanel {...props} scope="section" testIdPrefix="dashboard-error" />;
}
