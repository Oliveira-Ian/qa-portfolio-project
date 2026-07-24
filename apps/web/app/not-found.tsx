import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center">
      <h1 className="text-2xl font-semibold text-foreground" data-testid="not-found-title">
        Page not found
      </h1>
      <p className="text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Button
        asChild
        className="rounded-md bg-primary text-primary-foreground hover:bg-primary-hover"
        data-testid="not-found-button-home"
      >
        <Link href="/home">Go home</Link>
      </Button>
    </div>
  );
}
