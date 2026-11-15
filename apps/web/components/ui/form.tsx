'use client';

import * as React from 'react';
import { Slot } from 'radix-ui';
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

import { cn } from '@/lib/utils';
import { translateApiMessage } from '@/lib/i18n/api-messages';
import { useT } from '@/lib/i18n/provider';
import { InfoTip } from '@/components/ui/info-tip';
import { Label } from '@/components/ui/label';

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue);

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: ControllerProps<TFieldValues, TName>) {
  const value = React.useMemo(() => ({ name: props.name }), [props.name]);

  return (
    <FormFieldContext.Provider value={value}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
}

type FormItemContextValue = {
  id: string;
  required: boolean;
};

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

/**
 * Wires a field's label, control, description and error together: the ids below
 * are what let a screen reader announce the error when focus lands on the input,
 * and what makes clicking the label focus the control.
 */
function useFormField() {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error('useFormField must be used within <FormField>');
  }

  const { id, required } = itemContext;

  return {
    id,
    required,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
}

/**
 * One field. `required` marks it — an asterisk on the label and `aria-required`
 * on the control — so a person sees which fields they must fill before trying
 * to save, not after.
 */
function FormItem({
  className,
  required = false,
  ...props
}: React.ComponentProps<'div'> & { required?: boolean }) {
  const id = React.useId();
  const value = React.useMemo(() => ({ id, required }), [id, required]);

  // `grid-cols-1` (a `minmax(0, 1fr)` track) and `min-w-0`: a long value — a full
  // address in a combobox — is cut with an ellipsis instead of widening the field
  // past its column.
  return (
    <FormItemContext.Provider value={value}>
      <div
        data-slot="form-item"
        className={cn('grid min-w-0 grid-cols-1 gap-2', className)}
        {...props}
      />
    </FormItemContext.Provider>
  );
}

/**
 * The field's label. `help` explains the field on demand — an "i" beside the label
 * with a tooltip (hover, focus, click or tap) — instead of a line of text under the
 * field that takes room and pushes the fields beside it out of line.
 */
function FormLabel({
  className,
  children,
  help,
  helpTestId,
  ...props
}: React.ComponentProps<typeof Label> & { help?: React.ReactNode; helpTestId?: string }) {
  const t = useT();
  const { error, formItemId, required } = useFormField();
  const label = (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn('data-[error=true]:text-destructive', className)}
      htmlFor={formItemId}
      {...props}
    >
      {children}
      {required ? (
        <span aria-hidden="true" className="text-destructive" data-slot="form-required">
          *
        </span>
      ) : null}
    </Label>
  );

  if (!help) {
    return label;
  }

  return (
    <div className="flex items-center gap-1.5">
      {label}
      <InfoTip
        label={
          typeof children === 'string'
            ? t('common.aboutField', { label: children })
            : t('common.moreInfo')
        }
        {...(helpTestId ? { 'data-testid': helpTestId } : {})}
      >
        {help}
      </InfoTip>
    </div>
  );
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot.Root>) {
  const { error, formItemId, formDescriptionId, formMessageId, required } = useFormField();

  return (
    <Slot.Root
      data-slot="form-control"
      id={formItemId}
      aria-describedby={error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId}
      aria-invalid={!!error}
      aria-required={required || undefined}
      {...props}
    />
  );
}

/**
 * Help text. It stays put while the field fails — an error never moves the
 * layout (docs/design/components/forms.md): the field turns red and the message
 * goes to a toast.
 */
function FormDescription({ className, ...props }: React.ComponentProps<'p'>) {
  const { formDescriptionId } = useFormField();

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

/**
 * A field's error, for assistive technology only. On screen a failing field
 * shows a red border and red label, and the message itself is in a toast — so
 * no text appears under the field and nothing shifts (decided 2026-11-10,
 * docs/design/components/forms.md). For a screen reader the message is still
 * here: linked from the control by `aria-describedby` and announced as it
 * appears. The schemas validate in English; the text is translated here.
 */
function FormMessage({ className, ...props }: Omit<React.ComponentProps<'p'>, 'children'>) {
  const t = useT();
  const { error, formMessageId } = useFormField();
  const body = error ? translateApiMessage(String(error.message ?? ''), t) : '';

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      aria-live="polite"
      className={cn('sr-only', className)}
      {...props}
    >
      {body}
    </p>
  );
}

export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
};
