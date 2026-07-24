import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home | Oliveira ERP',
};

export default function HomePage() {
  return (
    <div className="rounded-lg bg-card p-[var(--spacing-xl)] shadow-card" data-testid="home-page">
      <h1 className="mb-[var(--spacing-lg)] text-2xl font-semibold text-foreground">Home</h1>
      <p className="text-muted-foreground">
        Welcome to Oliveira ERP. Select an option from the sidebar to get started.
      </p>
    </div>
  );
}
