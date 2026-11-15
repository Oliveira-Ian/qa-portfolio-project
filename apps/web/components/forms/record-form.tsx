'use client';

import Link from 'next/link';
import { Pencil } from 'lucide-react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';
import { FormCard, FormCardActions, FormCardHeader } from './form-card';

export type RecordFormMode = 'create' | 'edit' | 'view';

interface RecordFormProps<TValues extends FieldValues> {
  mode: RecordFormMode;
  form: UseFormReturn<TValues, unknown, TValues>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  testIdPrefix: string;
  title: string;
  description?: string;
  /** "Save customer" on create; edit says "Save changes". */
  saveLabel: string;
  /** Where Cancel goes (create: the list; edit: the record) and Back goes (view: the list). */
  cancelHref: string;
  /** View mode: the Edit button's target — absent without the permission. */
  editHref?: string;
  /** Right of the title, before the actions — a status badge, say. */
  badges?: React.ReactNode;
  after?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * One record's page in its three modes, with the same fields in each (a field
 * can't be on the form and missing from the record): **create** and **edit**
 * end in Cancel and Save, **view** shows the fields read-only and carries Back
 * and Edit in its header, where every screen's actions are.
 */
export function RecordForm<TValues extends FieldValues>({
  mode,
  form,
  onSubmit,
  isPending,
  testIdPrefix,
  title,
  description,
  saveLabel,
  cancelHref,
  editHref,
  badges,
  after,
  children,
}: RecordFormProps<TValues>) {
  const t = useT();
  const isView = mode === 'view';

  return (
    <FormCard
      containerTestId={`${testIdPrefix}-container`}
      formTestId={testIdPrefix}
      form={form}
      onSubmit={isView ? (event) => event.preventDefault() : onSubmit}
      header={
        <FormCardHeader
          title={title}
          titleTestId={`${testIdPrefix}-title`}
          {...(description ? { description } : {})}
          actions={
            badges || isView ? (
              <>
                {badges}
                {isView ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      asChild
                      data-testid={`${testIdPrefix}-button-back`}
                    >
                      <Link href={cancelHref}>{t('common.back')}</Link>
                    </Button>
                    {editHref ? (
                      <Button asChild variant="edit" data-testid={`${testIdPrefix}-button-edit`}>
                        <Link href={editHref}>
                          <Pencil aria-hidden="true" />
                          {t('common.edit')}
                        </Link>
                      </Button>
                    ) : null}
                  </>
                ) : null}
              </>
            ) : undefined
          }
        />
      }
      footer={
        isView ? undefined : (
          <FormCardActions
            isPending={isPending}
            saveLabel={mode === 'create' ? saveLabel : t('common.saveChanges')}
            saveTestId={`${testIdPrefix}-button-save`}
            cancelHref={cancelHref}
            cancelTestId={`${testIdPrefix}-button-cancel`}
            cancelLabel={t('common.cancel')}
          />
        )
      }
      after={after}
    >
      {/* The mode, for product styling (the FSM shows view mode as read-only values); no box of its own. */}
      <div data-record-mode={mode} className="contents">
        {children}
      </div>
    </FormCard>
  );
}

/** The padding and the hairline between two sections of a record form. */
export function SectionBlock({ children }: { children: React.ReactNode }) {
  return <div className="px-6 py-7 max-sm:px-4">{children}</div>;
}
