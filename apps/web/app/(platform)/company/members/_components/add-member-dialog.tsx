'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { memberAddSchema, type MemberAddInput } from '@oliveira/schemas';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { translateApiMessage } from '@/lib/i18n/api-messages';
import { useT } from '@/lib/i18n/provider';
import { addMemberAction } from '../../_actions/add-member';

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName: string;
}

/**
 * "Add member" (the design's "Invite member", adapted to ADR 0018: there are no
 * invitations). It takes an e-mail and nothing else — the role and the product
 * access are adjusted afterwards, in the member's drawer — and the API answers
 * the same generic sentence whether or not that address had an account.
 */
export function AddMemberDialog({ open, onOpenChange, companyName }: AddMemberDialogProps) {
  const t = useT();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<MemberAddInput>({
    resolver: zodResolver(memberAddSchema),
    defaultValues: { email: '' },
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      form.reset();
    }

    onOpenChange(next);
  }

  function handleValid(values: MemberAddInput) {
    if (isPending) {
      return;
    }

    startTransition(async () => {
      const result = await addMemberAction(values);
      const message = translateApiMessage(result.message ?? '', t);

      if (!result.success) {
        toast.error(message);
        return;
      }

      toast.success(message);
      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent data-testid="company-add-member-dialog">
        <DialogHeader>
          <DialogTitle className="text-lg leading-6">{t('company.add.title')}</DialogTitle>
          <DialogDescription>
            {t('company.add.description', { company: companyName })}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="grid gap-4"
            onSubmit={form.handleSubmit(handleValid)}
            noValidate
            data-testid="company-add-member-form"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('company.add.email')}</FormLabel>
                  <div className="relative flex items-center">
                    <Mail
                      className="pointer-events-none absolute left-3 size-4 text-text-3"
                      aria-hidden="true"
                    />
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        autoComplete="off"
                        inputMode="email"
                        autoCapitalize="none"
                        spellCheck={false}
                        placeholder={t('company.add.placeholder')}
                        className="pl-9"
                        data-testid="company-add-member-email"
                      />
                    </FormControl>
                  </div>
                  <FormMessage data-testid="company-add-member-email-error" />
                </FormItem>
              )}
            />

            <p className="text-[13px] text-text-3">{t('company.add.note')}</p>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                data-testid="company-add-member-cancel"
              >
                {t('company.add.cancel')}
              </Button>
              <Button type="submit" loading={isPending} data-testid="company-add-member-submit">
                {t('company.add.submit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
