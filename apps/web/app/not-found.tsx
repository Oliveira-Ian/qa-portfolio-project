import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-16 text-center">
      <p className="eyebrow text-primary">404</p>
      <h1
        className="mt-3 font-display text-2xl font-semibold text-foreground"
        data-testid="not-found-title"
      >
        There&rsquo;s nothing at this address
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        The page may have been renamed, or the record it pointed at was deleted.
      </p>

      <Button asChild className="mt-6" data-testid="not-found-button-home">
        <Link href="/home">Back to Home</Link>
      </Button>
    </div>
  );
}
