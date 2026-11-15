'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import { PageHeader } from '@/components/layout/page-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useT } from '@/lib/i18n/provider';
import type { MessageKey } from '@/lib/i18n/translate';

interface FormCardProps<TFieldValues extends FieldValues> {
  /** e.g. `"person-form-container"` / `"profile-form-container"`. */
  containerTestId: string;
  /** e.g. `"person-form"` / `"profile-form"`. */
  formTestId: string;
  /** Usually a `<FormCardHeader>`, but the read-only Person record uses its own `PersonRecordHeader` here instead. */
  header: ReactNode;
  form: UseFormReturn<TFieldValues, unknown, TFieldValues>;
  /** Omit for a read-only form that never submits (the Person view route). */
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  /** The action buttons — usually a `<FormCardActions>`, in the card's footer. Omit for a read-only form. */
  footer?: ReactNode;
  /** The sentence under "Check N fields" when a submit fails — the entity says what wasn't saved. */
  errorBodyKey?: MessageKey;
  /** Rendered after the form, inside the same card — e.g. the Person record's `AccountSection`. */
  after?: ReactNode;
  children: ReactNode;
}

/**
 * The shell every entity form shares (design S15): the page header above, an
 * error summary that appears once a submit has failed validation, then one
 * bordered card holding the fields (each field component pads itself — a tabbed
 * form's tab list runs edge to edge) and a footer row on a tinted ground with
 * the actions. What differs per entity — the header's content, the fields, the
 * footer's buttons — stays a slot rather than a prop FormCard tries to model,
 * since the Person record view (no Save button, its own header, an extra
 * `AccountSection` block) doesn't fit the same shape as create/edit.
 */
export function FormCard<TFieldValues extends FieldValues>({
  containerTestId,
  formTestId,
  header,
  form,
  onSubmit,
  footer,
  errorBodyKey,
  after,
  children,
}: FormCardProps<TFieldValues>) {
  const t = useT();
  const { submitCount, errors } = form.formState;
  const errorCount = Object.keys(errors).length;
  const hasSummary = submitCount > 0 && errorCount > 0 && errorBodyKey !== undefined;

  return (
    <div className="max-w-[60rem]" data-testid={containerTestId}>
      {header}

      {hasSummary ? (
        <Alert variant="destructive" className="mb-5" data-testid={`${formTestId}-error-summary`}>
          <AlertTitle>{t('common.checkFields', { count: errorCount })}</AlertTitle>
          <AlertDescription>{t(errorBodyKey)}</AlertDescription>
        </Alert>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <Form {...form}>
          <form data-testid={formTestId} onSubmit={onSubmit} noValidate>
            {children}

            {footer ? (
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-surface-2 px-6 py-4">
                {footer}
              </div>
            ) : null}
          </form>
        </Form>

        {after}
      </div>
    </div>
  );
}

interface FormCardHeaderProps {
  title: string;
  titleTestId: string;
  description?: string;
  /** Right-aligned, e.g. the type/status badges on the Person edit form. */
  actions?: ReactNode;
}

/**
 * The title block shared by every create/edit form: the H1, an optional line
 * under it, and anything that belongs on the right. It is the page header, not
 * a card header — the breadcrumb above it is the shell's.
 */
export function FormCardHeader({ title, titleTestId, description, actions }: FormCardHeaderProps) {
  return (
    <PageHeader
      title={title}
      titleTestId={titleTestId}
      {...(description ? { description } : {})}
      {...(actions ? { actions } : {})}
    />
  );
}

interface FormCardActionsProps {
  isPending: boolean;
  saveLabel: string;
  saveTestId: string;
  cancelHref: string;
  cancelTestId: string;
  cancelLabel: string;
}

/** Cancel (ghost) and Save (primary, rightmost — with the loading state) for a form footer. */
export function FormCardActions({
  isPending,
  saveLabel,
  saveTestId,
  cancelHref,
  cancelTestId,
  cancelLabel,
}: FormCardActionsProps) {
  return (
    <>
      <Button type="button" variant="ghost" asChild data-testid={cancelTestId}>
        <Link href={cancelHref}>{cancelLabel}</Link>
      </Button>
      <Button type="submit" data-testid={saveTestId} loading={isPending}>
        {saveLabel}
      </Button>
    </>
  );
}
