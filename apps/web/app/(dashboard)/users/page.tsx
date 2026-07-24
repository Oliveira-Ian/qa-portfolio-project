import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Users | Oliveira ERP',
};

export default function UsersPage() {
  return (
    <div className="rounded-lg bg-card p-[var(--spacing-xl)] shadow-card">
      <h1 className="mb-[var(--spacing-lg)] text-2xl font-semibold text-foreground">Users</h1>
      <p className="text-muted-foreground">User management page.</p>
    </div>
  );
}
