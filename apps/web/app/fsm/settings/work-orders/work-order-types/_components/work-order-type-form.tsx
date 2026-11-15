'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  WORK_ORDER_PRIORITIES,
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
import { Combobox } from '@/components/ui/combobox';
import { formatDuration } from '@/lib/fsm-format';
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

  const durationOptions = [
    { value: '', label: t('fsmUi.workOrderType.noDuration') },
    ...[30, 60, 90, 120, 180, 240, 300, 360, 480].map((minutes) => ({
      value: String(minutes),
      label: formatDuration(minutes, t),
    })),
  ];
  const rule = (name: 'requiresEquipment' | 'countsAsPreventive') => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <label className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-border px-4 py-3.5">
            <Checkbox
              checked={field.value}
              disabled={disabled}
              className="mt-0.5"
              data-testid={`work-order-type-form-checkbox-${name}`}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">{t(`fsmUi.workOrderType.${name}`)}</span>
              <span className="text-[12.5px] text-text-3">
                {t(`fsmUi.workOrderType.${name}Body`)}
              </span>
            </span>
          </label>
        </FormItem>
      )}
    />
  );

  return (
    // Few fields: a narrow column (board FSM-10).
    <div className="max-w-[760px]">
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
        <SectionBlock>
          <FormSection
            title={t('fsmUi.workOrderType.defaults')}
            description={t('fsmUi.workOrderType.defaultsBody')}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="defaultPriority"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{t('fsmUi.workOrderType.priority')}</FormLabel>
                    <FormControl>
                      <Combobox
                        options={[
                          { value: '', label: t('fsmUi.workOrderType.noPriority') },
                          ...WORK_ORDER_PRIORITIES.map((priority) => ({
                            value: priority,
                            label: t(`fsm.workOrders.priority.${priority}`),
                          })),
                        ]}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={disabled}
                        data-testid="work-order-type-form-priority"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="estimatedMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fsmUi.workOrderType.duration')}</FormLabel>
                    <FormControl>
                      <Combobox
                        options={durationOptions}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={disabled}
                        data-testid="work-order-type-form-duration"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slaHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fsmUi.workOrderType.sla')}</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input
                          {...field}
                          inputMode="numeric"
                          disabled={disabled}
                          className="tabular w-24"
                          placeholder={t('fsmUi.workOrderType.slaPlaceholder')}
                          data-testid="work-order-type-form-input-sla"
                        />
                      </FormControl>
                      <span className="text-[13px] text-text-3">
                        {t('fsmUi.workOrderType.slaSuffix')}
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </FormSection>
        </SectionBlock>
        <SectionBlock>
          <FormSection
            title={t('fsmUi.workOrderType.rules')}
            description={t('fsmUi.workOrderType.rulesBody')}
          >
            <div className="grid gap-3">
              {rule('requiresEquipment')}
              {rule('countsAsPreventive')}
              {type && type.workOrderCount > 0 ? (
                <p className="m-0 text-[12.5px] text-text-3">
                  {t('fsmUi.workOrderType.usedBy', { count: type.workOrderCount })}
                </p>
              ) : null}
            </div>
          </FormSection>
        </SectionBlock>
      </RecordForm>
    </div>
  );
}
