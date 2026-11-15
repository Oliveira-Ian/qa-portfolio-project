'use client';

import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  PRODUCT_LABELS,
  accountProfileFormSchema,
  type AccountDto,
  type AccountProfileFormValues,
  type Product,
  type ProfileDto,
} from '@oliveira/schemas';
import { FormCard, FormCardActions, FormCardHeader } from '@/components/forms/form-card';
import { FormSection } from '@/components/forms/form-section';
import { useEntityForm } from '@/components/forms/use-entity-form';
import { Combobox } from '@/components/ui/combobox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { ActionResult } from '@/lib/actions';
import { useT } from '@/lib/i18n/provider';

interface UserProfileFormProps {
  product: Product;
  account: AccountDto;
  /** Every profile of the product in the company — a small, admin-managed list. */
  profiles: ProfileDto[];
  setProfileAction: (accountId: number, values: AccountProfileFormValues) => Promise<ActionResult>;
  /** The list's URL — Cancel and a successful save go back to the record. */
  basePath: string;
}

/**
 * Picks the member's one profile in this product — or none, which leaves them
 * able to open the product and do nothing in it. The product's profiles are
 * edited on their own screen; this only chooses among them.
 */
export function UserProfileForm({
  product,
  account,
  profiles,
  setProfileAction,
  basePath,
}: UserProfileFormProps) {
  const t = useT();
  const router = useRouter();
  const productName = PRODUCT_LABELS[product];
  const recordHref = `${basePath}/${account.id}`;
  const { form, isPending, onSubmit } = useEntityForm<AccountProfileFormValues>(
    zodResolver(accountProfileFormSchema),
    { profileId: account.profile ? String(account.profile.id) : '' },
    async (values) => {
      const result = await setProfileAction(account.id, values);

      if (result.success) {
        toast.success(t('accessControl.users.saved'));
        router.push(recordHref);
        router.refresh();
      }

      return result;
    },
  );

  const options = [
    { value: '', label: t('accessControl.users.noProfile') },
    ...profiles.map((profile) => ({ value: String(profile.id), label: profile.name })),
  ];

  return (
    <FormCard
      containerTestId="user-profile-form-container"
      formTestId="user-profile-form"
      form={form}
      onSubmit={onSubmit}
      header={
        <FormCardHeader
          title={account.personName}
          titleTestId="user-profile-form-title"
          description={t('accessControl.users.form.lead', { product: productName })}
        />
      }
      footer={
        <FormCardActions
          isPending={isPending}
          saveLabel={t('accessControl.users.form.save')}
          saveTestId="user-profile-form-button-save"
          cancelHref={recordHref}
          cancelTestId="user-profile-form-button-cancel"
          cancelLabel={t('accessControl.users.form.cancel')}
        />
      }
    >
      <div className="px-6 py-7">
        <FormSection
          title={t('accessControl.users.form.section', { product: productName })}
          description={t('accessControl.users.form.sectionHelp')}
        >
          <FormField
            control={form.control}
            name="profileId"
            render={({ field }) => (
              <FormItem>
                <FormLabel help={t('accessControl.users.form.help')}>
                  {t('accessControl.users.columns.profile')}
                </FormLabel>
                <FormControl>
                  <Combobox
                    options={options}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t('accessControl.users.noProfile')}
                    searchPlaceholder={t('accessControl.users.form.search')}
                    emptyText={t('accessControl.users.form.noMatch')}
                    data-testid="user-profile-form-profile"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>
      </div>
    </FormCard>
  );
}
