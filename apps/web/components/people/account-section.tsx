'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import type { AccountDto, PersonTypeValue } from '@oliveira/schemas';
import { FormSection } from '@/components/forms/form-section';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/badge';
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
import { translateApiMessage } from '@/lib/i18n/api-messages';
import { useT } from '@/lib/i18n/provider';
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
  isCompanyAdmin: boolean;
  mode: 'view' | 'edit';
  /** Only needed in `edit` mode, when there is no account yet. */
  createAccount?: CreateAccount;
}

function SectionShell({ children }: { children: React.ReactNode }) {
  const t = useT();

  return (
    <div className="border-t border-border px-6 py-7" data-testid="account-section">
      <FormSection title={t('erp.people.account.legend')}>{children}</FormSection>
    </div>
  );
}

function AccountSummary({ account }: { account: AccountDto }) {
  const t = useT();

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-2 px-4 py-3">
      <ShieldCheck className="size-4 shrink-0 text-text-3" aria-hidden="true" />
      <span className="olv-data text-foreground" data-testid="account-section-email">
        {account.email}
      </span>
      <Badge variant="default">{account.role}</Badge>
      <StatusBadge tone={account.active ? 'success' : 'neutral'}>
        {t(account.active ? 'erp.status.active' : 'erp.status.inactive')}
      </StatusBadge>
      <Link
        href={ROUTES.accounts.list}
        className="ml-auto rounded-xs text-sm font-semibold text-foreground underline underline-offset-3 focus-visible:ring-focus"
        data-testid="account-section-link-manage"
      >
        {t('erp.people.account.manage')}
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
  const t = useT();
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
        toast.error(translateApiMessage(result.message ?? '', t));
        return;
      }

      toast.success(t('erp.people.account.created'));
      router.refresh();
    });
  });

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4 rounded-lg border border-border bg-surface-2 px-4 py-4"
        data-testid="account-section-create-form"
        onSubmit={onSubmit}
        noValidate
      >
        <p className="text-sm text-text-2">{t('erp.people.account.intro')}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-testid="account-section-label-email">
                  {t('erp.people.account.loginEmail')}
                </FormLabel>
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
                <FormLabel data-testid="account-section-label-password">
                  {t('erp.people.account.password')}
                </FormLabel>
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
          loading={isPending}
          data-testid="account-section-button-create"
        >
          {t('erp.people.account.create')}
        </Button>
      </form>
    </Form>
  );
}

/**
 * Only ever shown to the company's administrator: giving a person a login is
 * the surface the API itself restricts to `requireCompanyAdmin` — anyone else
 * viewing this section would see a feature they have no endpoint to actually use.
 *
 * Role, active/inactive and profile links stay owned by the Access Control
 * screen (`ROUTES.accounts.list`) once an account exists — duplicating those
 * controls here would mean two places that can go out of sync.
 */
export function AccountSection({
  personId,
  types,
  account,
  isCompanyAdmin,
  mode,
  createAccount,
}: AccountSectionProps) {
  const t = useT();

  if (!isCompanyAdmin || !types.includes('USER')) {
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
        <p className="text-sm text-text-2" data-testid="account-section-none">
          {t('erp.people.account.none')}
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
