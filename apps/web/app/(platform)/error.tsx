'use client';

import { ErrorPanel } from '@/components/platform/error-panel';

/** The Platform's boundary — replaces only the content slot, like the ERP's. */
export default function PlatformErrorBoundary(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPanel {...props} scope="section" testIdPrefix="platform-error" />;
}
