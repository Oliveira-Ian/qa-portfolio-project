'use client';

import { ErrorPanel } from '@/components/platform/error-panel';

/** The root boundary: what fails above any layout — a layout's own `getMe()`, or the auth routes. */
export default function ErrorBoundary(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPanel {...props} scope="screen" testIdPrefix="error" />;
}
