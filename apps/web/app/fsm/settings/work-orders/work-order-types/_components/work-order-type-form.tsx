'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  emptyWorkOrderTypeFormValues,
  workOrderTypeToFormValues,
  workOrderTypeWriteSchema,
  type WorkOrderTypeDto,
  type WorkOrderTypeFormValues,
} from '@oliveira/schemas';
import { FormSection } from '@/components/forms/form-section';
import { RecordForm, SectionBlock, type RecordFormMode } from '@/components/forms/record-form';
import { useEntityForm } from '@/components/forms/use-entity-form';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import { saveWorkOrderTypeAction } from '../_actions/work-order-type-actions';

interface WorkOrderTypeFormProps {
  mode: RecordFormMode;
  type?: WorkOrderTypeDto;
  canEdit?: boolean;
}

const routes = ROUTES.fsm.workOrderTypes;

/** A work order type in its three modes — new, view and edit share the same fields. */
export function WorkOrderTypeForm({ mode, type, canEdit = false }: WorkOrderTypeFormProps) {
  const t = useT();
  const disabled = mode === 'view';
  const { form, isPending, onSubmit } = useEntityForm<WorkOrderTypeFormValues>(
    zodResolver(workOrderTypeWriteSchema),
    type ? workOrderTypeToFormValues(type) : emptyWorkOrderTypeFormValues,
    (values) => saveWorkOrderTypeAction(values, type?.id),
    {
      message: t(type ? 'fsm.workOrderTypes.form.updated' : 'fsm.workOrderTypes.form.created'),
      href: (id) => (id ? routes.view(id) : routes.list),
    },
  );

  return (
    <RecordForm
      mode={mode}
      form={form}
      onSubmit={onSubmit}
      isPending={isPending}
      testIdPrefix="work-order-type-form"
      title={type?.name ?? t('fsm.workOrderTypes.form.newTitle')}
      {...(type ? {} : { description: t('fsm.workOrderTypes.form.newDescription') })}
      saveLabel={t('fsm.workOrderTypes.form.save')}
      cancelHref={type && mode === 'edit' ? routes.view(type.id) : routes.list}
      {...(type && canEdit ? { editHref: routes.edit(type.id) } : {})}
    >
      <SectionBlock>
        <FormSection
          title={t('fsm.workOrderTypes.form.section.title')}
          description={t('fsm.workOrderTypes.form.section.body')}
        >
          <div className="grid gap-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem required>
                  <FormLabel>{t('fsm.workOrderTypes.form.fields.name')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={disabled}
                      autoComplete="off"
                      data-testid="work-order-type-form-input-name"
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
                <FormItem>
                  <FormLabel>{t('fsm.workOrderTypes.form.fields.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      disabled={disabled}
                      data-testid="work-order-type-form-input-description"
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
                <FormItem>
                  <label className="flex w-fit cursor-pointer items-center gap-2.5 py-1 text-sm text-foreground">
                    <Checkbox
                      checked={field.value}
                      disabled={disabled}
                      data-testid="work-order-type-form-checkbox-active"
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                    {t('fsm.workOrderTypes.form.fields.active')}
                  </label>
                </FormItem>
              )}
            />
          </div>
        </FormSection>
      </SectionBlock>
    </RecordForm>
  );
}
