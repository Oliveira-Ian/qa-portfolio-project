'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import type { AccountDto, PersonTypeValue } from '@oliveira/schemas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { ActionResult } from '@/lib/actions';
import { ROUTES } from '@/lib/navigation/routes';

const createAccountFormSchema = z.object({
  email: z.string().trim().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type CreateAccountFormValues = z.infer<typeof createAccountFormSchema>;

type CreateAccount = (personId: string, values: CreateAccountFormValues) => Promise<ActionResult>;

interface AccountSectionProps {
  personId: string;
  types: PersonTypeValue[];
  account: AccountDto | null;
  isAdmin: boolean;
  mode: 'view' | 'edit';
  /** Only needed in `edit` mode, when there is no account yet. */
  createAccount?: CreateAccount;
}

function SectionShell({ children }: { children: React.ReactNode }) {
  return (
    <fieldset className="min-w-0" data-testid="account-section">
      <legend className="eyebrow text-muted-foreground">Access account</legend>
      <div className="measured-rule mt-2 mb-5" aria-hidden="true" />
      {children}
    </fieldset>
  );
}

function AccountSummary({ account }: { account: AccountDto }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-muted/40 px-4 py-3">
      <ShieldCheck className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="text-sm text-foreground" data-testid="account-section-email">
        {account.email}
      </span>
      <Badge variant="outline" className="eyebrow border-border text-muted-foreground">
        {account.role}
      </Badge>
      <Badge
        variant="outline"
        className={
          account.active
            ? 'eyebrow border-toast-success/40 bg-toast-success/10 text-toast-success'
            : 'eyebrow border-border bg-muted text-muted-foreground'
        }
      >
        {account.active ? 'Active' : 'Inactive'}
      </Badge>
      <Link
        href={ROUTES.accounts.list}
        className="ml-auto text-sm text-primary underline-offset-4 hover:underline"
        data-testid="account-section-link-manage"
      >
        Manage in Users →
      </Link>
    </div>
  );
}

function CreateAccountForm({
  personId,
  createAccount,
}: {
  personId: string;
  createAccount: CreateAccount;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateAccountFormValues>({
    resolver: zodResolver(createAccountFormSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createAccount(personId, values);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success('Access account created');
      router.refresh();
    });
  });

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4 rounded-md border border-border bg-muted/40 px-4 py-4"
        data-testid="account-section-create-form"
        onSubmit={onSubmit}
        noValidate
      >
        <p className="text-sm text-muted-foreground">
          This person doesn&rsquo;t have sign-in access yet. Set an email and a password to create
          one.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-testid="account-section-label-email">Login email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    autoComplete="email"
                    data-testid="account-section-input-email"
                  />
                </FormControl>
                <FormMessage data-testid="account-section-error-email" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-testid="account-section-label-password">Password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    autoComplete="new-password"
                    data-testid="account-section-input-password"
                  />
                </FormControl>
                <FormMessage data-testid="account-section-error-password" />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          size="sm"
          className="w-fit"
          disabled={isPending}
          data-testid="account-section-button-create"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Creating…
            </>
          ) : (
            'Create access account'
          )}
        </Button>
      </form>
    </Form>
  );
}

/**
 * Only ever shown to an ADMIN: the account it manages carries a role and a
 * password, which is exactly the surface the API itself restricts to
 * `requireRole('ADMIN')` — a non-admin viewing this section would see a
 * feature they have no endpoint to actually use.
 *
 * Role, active/inactive and profile links stay owned by the Access Control
 * screen (`/administration/access-control/users`, `ROUTES.accounts.list`)
 * once an account exists — duplicating those controls here would mean two
 * places that can go out of sync.
 */
export function AccountSection({
  personId,
  types,
  account,
  isAdmin,
  mode,
  createAccount,
}: AccountSectionProps) {
  if (!isAdmin || !types.includes('USER')) {
    return null;
  }

  if (account) {
    return (
      <SectionShell>
        <AccountSummary account={account} />
      </SectionShell>
    );
  }

  if (mode === 'view' || !createAccount) {
    return (
      <SectionShell>
        <p className="text-sm text-muted-foreground" data-testid="account-section-none">
          No sign-in access yet.
        </p>
      </SectionShell>
    );
  }

  return (
    <SectionShell>
      <CreateAccountForm personId={personId} createAccount={createAccount} />
    </SectionShell>
  );
}
