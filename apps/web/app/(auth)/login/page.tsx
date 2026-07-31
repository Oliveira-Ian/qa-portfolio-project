import type { Metadata } from 'next';
import { LoginForm } from './_components/login-form';

export const metadata: Metadata = {
  title: 'Sign in',
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

/**
 * Reading `next` here rather than with `useSearchParams` in the form keeps the
 * client component free of a Suspense requirement, and hands it the one string
 * it needs instead of the whole params object.
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;

  return <LoginForm next={next} />;
}
