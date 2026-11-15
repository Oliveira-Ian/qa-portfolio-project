'use client';

import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import { toast } from 'sonner';
import {
  companyProfileToFormValues,
  companyProfileWriteSchema,
  type CompanyProfileDto,
  type CompanyProfileFormValues,
} from '@oliveira/schemas';
import { AddressFields } from '@/components/forms/address-fields';
import { FormCard, FormCardActions, FormCardHeader } from '@/components/forms/form-card';
import { FormSection } from '@/components/forms/form-section';
import { useEntityForm } from '@/components/forms/use-entity-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MaskedInput } from '@/components/ui/masked-input';
import { useT } from '@/lib/i18n/provider';
import { maskDocument, maskPhone } from '@/lib/masks';
import { ROUTES } from '@/lib/navigation/routes';
import { updateCompanyProfileAction } from '../../_actions/update-company-profile';

type TextField = Exclude<keyof CompanyProfileFormValues, 'phone'>;

interface CompanyProfileFormProps {
  company: CompanyProfileDto;
}

/**
 * The company's registration, edited by its account administrator on the
 * Platform. The legal name and the CNPJ are shown, read-only: they identify the
 * company to Oliveira and are changed only by Oliveira.
 */
export function CompanyProfileForm({ company }: CompanyProfileFormProps) {
  const t = useT();
  const router = useRouter();
  const { form, isPending, onSubmit } = useEntityForm<CompanyProfileFormValues>(
    zodResolver(companyProfileWriteSchema) as Resolver<
      CompanyProfileFormValues,
      unknown,
      CompanyProfileFormValues
    >,
    companyProfileToFormValues(company),
    async (values) => {
      const result = await updateCompanyProfileAction(values);

      if (result.success) {
        toast.success(t('company.profile.saved'));
        router.push(ROUTES.company.overview);
        router.refresh();
      }

      return result;
    },
  );

  function textField(name: TextField, labelKey: Parameters<typeof t>[0], autoComplete?: string) {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t(labelKey)}</FormLabel>
            <FormControl>
              <Input
                {...field}
                {...(autoComplete ? { autoComplete } : {})}
                data-testid={`company-form-${name}`}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return (
    <FormCard
      containerTestId="company-form-container"
      formTestId="company-form"
      form={form}
      onSubmit={onSubmit}
      header={
        <FormCardHeader
          title={t('company.profile.editTitle')}
          titleTestId="company-form-title"
          description={t('company.profile.lead')}
        />
      }
      footer={
        <FormCardActions
          isPending={isPending}
          saveLabel={t('company.profile.save')}
          saveTestId="company-form-button-save"
          cancelHref={ROUTES.company.overview}
          cancelTestId="company-form-button-cancel"
          cancelLabel={t('company.profile.cancel')}
        />
      }
    >
      <div className="divide-y divide-border">
        <div className="px-6 py-7">
          <FormSection
            title={t('company.profile.sections.identification')}
            description={t('company.profile.sections.identificationHelp')}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="company-form-legal-name">
                  {t('company.profile.fields.legalName')}
                </Label>
                <Input
                  id="company-form-legal-name"
                  value={company.legalName}
                  readOnly
                  disabled
                  data-testid="company-form-legal-name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company-form-document">
                  {t('company.profile.fields.document')}
                </Label>
                <Input
                  id="company-form-document"
                  value={company.document ? maskDocument(company.document, 'CNPJ') : '—'}
                  readOnly
                  disabled
                  className="olv-data"
                  data-testid="company-form-document"
                />
              </div>
              {textField('tradeName', 'company.profile.fields.tradeName', 'organization')}
              {textField('stateRegistration', 'company.profile.fields.stateRegistration')}
              {textField('municipalRegistration', 'company.profile.fields.municipalRegistration')}
            </div>
          </FormSection>
        </div>

        <div className="px-6 py-7">
          <FormSection
            title={t('company.profile.sections.contact')}
            description={t('company.profile.sections.contactHelp')}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              {textField('email', 'company.profile.fields.email', 'email')}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('company.profile.fields.phone')}</FormLabel>
                    <FormControl>
                      <MaskedInput
                        {...field}
                        mask={maskPhone}
                        inputMode="tel"
                        autoComplete="tel"
                        data-testid="company-form-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="sm:col-span-2">
                {textField('website', 'company.profile.fields.website', 'url')}
              </div>
            </div>
          </FormSection>
        </div>

        <div className="px-6 py-7">
          <FormSection
            title={t('company.profile.sections.address')}
            description={t('company.profile.sections.addressHelp')}
          >
            <AddressFields<CompanyProfileFormValues> testIdPrefix="company-form-address" />
          </FormSection>
        </div>
      </div>
    </FormCard>
  );
}
