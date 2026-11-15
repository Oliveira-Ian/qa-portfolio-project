'use client';

import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { memberAddSchema, type MemberAddInput } from '@oliveira/schemas';
import { FormCard, FormCardActions, FormCardHeader } from '@/components/forms/form-card';
import { FormSection } from '@/components/forms/form-section';
import { useEntityForm } from '@/components/forms/use-entity-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { translateApiMessage } from '@/lib/i18n/api-messages';
import { useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import { addMemberAction } from '../../../_actions/add-member';

/**
 * Adds someone who already has an Oliveira account, by e-mail — nothing else:
 * the API answers the same sentence whether or not that address has an
 * account, so who is registered is never revealed. Role and product access are
 * set afterwards on the member's page. Invitations for people without an
 * account come later (they need e-mail delivery).
 */
export function NewMemberForm({ companyName }: { companyName: string }) {
  const t = useT();
  const router = useRouter();
  const { form, isPending, onSubmit } = useEntityForm<MemberAddInput>(
    zodResolver(memberAddSchema),
    { email: '' },
    async (values) => {
      const result = await addMemberAction(values);

      if (result.success) {
        toast.success(translateApiMessage(result.message ?? '', t));
        router.push(ROUTES.company.members);
        router.refresh();
      }

      return result;
    },
  );

  return (
    <FormCard
      containerTestId="company-add-member-container"
      formTestId="company-add-member-form"
      form={form}
      onSubmit={onSubmit}
      header={
        <FormCardHeader
          title={t('company.add.title')}
          titleTestId="company-add-member-title"
          description={t('company.add.description', { company: companyName })}
        />
      }
      footer={
        <FormCardActions
          isPending={isPending}
          saveLabel={t('company.add.submit')}
          saveTestId="company-add-member-submit"
          cancelHref={ROUTES.company.members}
          cancelTestId="company-add-member-cancel"
          cancelLabel={t('company.add.cancel')}
        />
      }
    >
      <div className="px-6 py-7">
        <FormSection title={t('company.add.section')} description={t('company.add.note')}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem required>
                <FormLabel help={t('company.add.privacy')}>{t('company.add.email')}</FormLabel>
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
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>
      </div>
    </FormCard>
  );
}
