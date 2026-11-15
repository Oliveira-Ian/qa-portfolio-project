'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import {
  branchToFormValues,
  branchWriteSchema,
  emptyBranchFormValues,
  type BranchDto,
  type BranchFormValues,
} from '@oliveira/schemas';
import { AddressFields } from '@/components/forms/address-fields';
import { FormSection } from '@/components/forms/form-section';
import { RecordForm, SectionBlock, type RecordFormMode } from '@/components/forms/record-form';
import { useEntityForm } from '@/components/forms/use-entity-form';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MaskedInput } from '@/components/ui/masked-input';
import { useT } from '@/lib/i18n/provider';
import { maskDocument, maskPhone } from '@/lib/masks';
import { ROUTES } from '@/lib/navigation/routes';
import { saveBranchAction } from '../_actions/branch-actions';

interface BranchFormProps {
  mode: RecordFormMode;
  branch?: BranchDto;
  canEdit?: boolean;
}

const routes = ROUTES.fsm.branches;

type TextField = 'code' | 'name' | 'stateRegistration' | 'email';

/** A branch in its three modes — new, view and edit share the same fields. */
export function BranchForm({ mode, branch, canEdit = false }: BranchFormProps) {
  const t = useT();
  const disabled = mode === 'view';
  const { form, isPending, onSubmit } = useEntityForm<BranchFormValues>(
    zodResolver(branchWriteSchema) as Resolver<BranchFormValues, unknown, BranchFormValues>,
    branch ? branchToFormValues(branch) : emptyBranchFormValues,
    (values) => saveBranchAction(values, branch?.id),
    {
      message: t(branch ? 'fsm.branches.form.updated' : 'fsm.branches.form.created'),
      href: (id) => (id ? routes.view(id) : routes.list),
    },
  );

  function textField(
    name: TextField,
    labelKey: Parameters<typeof t>[0],
    options: { required?: boolean; help?: Parameters<typeof t>[0]; className?: string } = {},
  ) {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem className={options.className} required={options.required ?? false}>
            <FormLabel {...(options.help ? { help: t(options.help) } : {})}>
              {t(labelKey)}
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                disabled={disabled}
                autoComplete="off"
                data-testid={`branch-form-input-${name}`}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return (
    <RecordForm
      mode={mode}
      form={form}
      onSubmit={onSubmit}
      isPending={isPending}
      testIdPrefix="branch-form"
      title={branch ? `${branch.code} · ${branch.name}` : t('fsm.branches.form.newTitle')}
      {...(branch ? {} : { description: t('fsm.branches.form.newDescription') })}
      saveLabel={t('fsm.branches.form.save')}
      cancelHref={branch && mode === 'edit' ? routes.view(branch.id) : routes.list}
      {...(branch && canEdit ? { editHref: routes.edit(branch.id) } : {})}
    >
      <div className="divide-y divide-border">
        <SectionBlock>
          <FormSection
            title={t('fsm.branches.form.sections.identification.title')}
            description={t('fsm.branches.form.sections.identification.body')}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              {textField('code', 'fsm.branches.form.fields.code', {
                required: true,
                help: 'fsm.branches.form.fields.codeHelp',
              })}
              {textField('name', 'fsm.branches.form.fields.name', { required: true })}
              <FormField
                control={form.control}
                name="document"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel help={t('fsm.branches.form.fields.documentHelp')}>
                      {t('fsm.branches.form.fields.document')}
                    </FormLabel>
                    <FormControl>
                      <MaskedInput
                        {...field}
                        mask={(value) => maskDocument(value, 'CNPJ')}
                        inputMode="numeric"
                        className="tabular"
                        placeholder="00.000.000/0000-00"
                        disabled={disabled}
                        data-testid="branch-form-input-document"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {textField('stateRegistration', 'fsm.branches.form.fields.stateRegistration')}
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <label className="flex w-fit cursor-pointer items-center gap-2.5 py-1 text-sm text-foreground">
                      <Checkbox
                        checked={field.value}
                        disabled={disabled}
                        data-testid="branch-form-checkbox-active"
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                      {t('fsm.branches.form.fields.active')}
                    </label>
                  </FormItem>
                )}
              />
            </div>
          </FormSection>
        </SectionBlock>

        <SectionBlock>
          <FormSection
            title={t('fsm.branches.form.sections.contact.title')}
            description={t('fsm.branches.form.sections.contact.body')}
            optionalLabel={t('common.optional')}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              {textField('email', 'fsm.branches.form.fields.email')}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fsm.branches.form.fields.phone')}</FormLabel>
                    <FormControl>
                      <MaskedInput
                        {...field}
                        mask={maskPhone}
                        type="tel"
                        inputMode="tel"
                        className="tabular"
                        disabled={disabled}
                        data-testid="branch-form-input-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </FormSection>
        </SectionBlock>

        <SectionBlock>
          <FormSection
            title={t('fsm.branches.form.sections.address.title')}
            description={t('fsm.branches.form.sections.address.body')}
            optionalLabel={t('common.optional')}
          >
            <AddressFields<BranchFormValues>
              prefix="address."
              disabled={disabled}
              testIdPrefix="branch-form-address"
            />
          </FormSection>
        </SectionBlock>
      </div>
    </RecordForm>
  );
}
