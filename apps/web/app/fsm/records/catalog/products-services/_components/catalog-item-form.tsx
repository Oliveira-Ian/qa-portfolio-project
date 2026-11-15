'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  CATALOG_ITEM_KINDS,
  catalogItemToFormValues,
  catalogItemWriteSchema,
  emptyCatalogItemFormValues,
  type CatalogItemDto,
  type CatalogItemFormValues,
} from '@oliveira/schemas';
import { FormSection } from '@/components/forms/form-section';
import { RecordForm, SectionBlock, type RecordFormMode } from '@/components/forms/record-form';
import { useEntityForm } from '@/components/forms/use-entity-form';
import { Checkbox } from '@/components/ui/checkbox';
import { CurrencyInput } from '@/components/ui/currency-input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Combobox } from '@/components/ui/combobox';
import { formatDuration } from '@/lib/fsm-format';
import { useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import { saveCatalogItemAction } from '../_actions/catalog-item-actions';

interface CatalogItemFormProps {
  mode: RecordFormMode;
  item?: CatalogItemDto;
  canEdit?: boolean;
}

const routes = ROUTES.fsm.catalogItems;

/** A product or service in its three modes — new, view and edit share the same fields. */
export function CatalogItemForm({ mode, item, canEdit = false }: CatalogItemFormProps) {
  const t = useT();
  const disabled = mode === 'view';
  const { form, isPending, onSubmit } = useEntityForm<CatalogItemFormValues>(
    zodResolver(catalogItemWriteSchema),
    item ? catalogItemToFormValues(item) : emptyCatalogItemFormValues,
    (values) => saveCatalogItemAction(values, item?.id),
    {
      message: t(item ? 'fsm.catalogItems.form.updated' : 'fsm.catalogItems.form.created'),
      href: (id) => (id ? routes.view(id) : routes.list),
    },
  );

  return (
    <RecordForm
      mode={mode}
      form={form}
      onSubmit={onSubmit}
      isPending={isPending}
      testIdPrefix="catalog-item-form"
      title={item?.name ?? t('fsm.catalogItems.form.newTitle')}
      {...(item ? {} : { description: t('fsm.catalogItems.form.newDescription') })}
      saveLabel={t('fsm.catalogItems.form.save')}
      cancelHref={item && mode === 'edit' ? routes.view(item.id) : routes.list}
      {...(item && canEdit ? { editHref: routes.edit(item.id) } : {})}
    >
      <div className="divide-y divide-border">
        <SectionBlock>
          <FormSection
            title={t('fsm.catalogItems.form.sections.identification.title')}
            description={t('fsm.catalogItems.form.sections.identification.body')}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="kind"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2" required>
                    <FormLabel>{t('fsm.catalogItems.form.fields.kind')}</FormLabel>
                    <FormControl>
                      <ToggleGroup
                        type="single"
                        variant="outline"
                        value={field.value}
                        disabled={disabled}
                        onValueChange={(value) => value && field.onChange(value)}
                        data-testid="catalog-item-form-kind"
                      >
                        {CATALOG_ITEM_KINDS.map((kind) => (
                          <ToggleGroupItem
                            key={kind}
                            value={kind}
                            className="px-4"
                            data-testid={`catalog-item-form-kind-${kind.toLowerCase()}`}
                          >
                            {t(`fsm.catalogItems.kind.${kind}`)}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2" required>
                    <FormLabel>{t('fsm.catalogItems.form.fields.name')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={disabled}
                        autoComplete="off"
                        data-testid="catalog-item-form-input-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel help={t('fsm.catalogItems.form.fields.codeHelp')}>
                      {t('fsm.catalogItems.form.fields.code')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={disabled}
                        autoComplete="off"
                        className="tabular"
                        data-testid="catalog-item-form-input-code"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{t('fsm.catalogItems.form.fields.description')}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        disabled={disabled}
                        data-testid="catalog-item-form-input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <label className="flex w-fit cursor-pointer items-center gap-2.5 py-1 text-sm text-foreground">
                      <Checkbox
                        checked={field.value}
                        disabled={disabled}
                        data-testid="catalog-item-form-checkbox-active"
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                      {t('fsm.catalogItems.form.fields.active')}
                    </label>
                  </FormItem>
                )}
              />
            </div>
          </FormSection>
        </SectionBlock>

        <SectionBlock>
          <FormSection
            title={t('fsm.catalogItems.form.sections.pricing.title')}
            description={t('fsm.catalogItems.form.sections.pricing.body')}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem required>
                    <FormLabel help={t('fsm.catalogItems.form.fields.unitHelp')}>
                      {t('fsm.catalogItems.form.fields.unit')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={disabled}
                        autoComplete="off"
                        className="uppercase"
                        maxLength={10}
                        data-testid="catalog-item-form-input-unit"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fsm.catalogItems.form.fields.price')}</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={field.value === '' ? null : Number(field.value)}
                        onChange={(amount) =>
                          field.onChange(amount === null ? '' : amount.toFixed(2))
                        }
                        disabled={disabled}
                        className="tabular"
                        data-testid="catalog-item-form-input-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* How long a service usually takes — a product has no duration. */}
              {form.watch('kind') === 'SERVICE' ? (
                <FormField
                  control={form.control}
                  name="estimatedMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('fsmUi.workOrderForm.duration')}</FormLabel>
                      <FormControl>
                        <Combobox
                          options={[
                            { value: '', label: t('fsmUi.workOrderForm.noDuration') },
                            ...[15, 30, 45, 60, 90, 120, 180, 240].map((minutes) => ({
                              value: String(minutes),
                              label: formatDuration(minutes, t),
                            })),
                          ]}
                          value={field.value}
                          onChange={field.onChange}
                          disabled={disabled}
                          data-testid="catalog-item-form-duration"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
            </div>
          </FormSection>
        </SectionBlock>
      </div>
    </RecordForm>
  );
}
