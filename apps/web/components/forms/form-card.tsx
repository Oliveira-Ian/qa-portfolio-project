import type { ReactNode } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';

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
  /** The action buttons — usually a `<FormCardActions>`, wrapped in the shared footer rule/spacing. */
  footer: ReactNode;
  /** Rendered after the form, inside the same card — e.g. the Person record's `AccountSection`. */
  after?: ReactNode;
  children: ReactNode;
}

/**
 * The card shell every entity form shares: bordered container, a header slot,
 * the `<Form>` (react-hook-form context) wrapping a padded `<form>`, and a
 * footer row separated by a rule. What differs per entity — the header's
 * content, the fields, and the footer's buttons — stays a slot rather than a
 * prop FormCard tries to model, since the Person record view (no Save
 * button, its own header, an extra `AccountSection` block) doesn't fit the
 * same shape as create/edit.
 */
export function FormCard<TFieldValues extends FieldValues>({
  containerTestId,
  formTestId,
  header,
  form,
  onSubmit,
  footer,
  after,
  children,
}: FormCardProps<TFieldValues>) {
  return (
    <div
      className="overflow-hidden rounded-lg border border-border bg-card shadow-card"
      data-testid={containerTestId}
    >
      {header}

      <Form {...form}>
        <form className="px-6 py-8 sm:px-8" data-testid={formTestId} onSubmit={onSubmit} noValidate>
          {children}

          <div className="mt-8 flex flex-wrap gap-3 border-t border-border pt-6">{footer}</div>
        </form>
      </Form>

      {after}
    </div>
  );
}

interface FormCardHeaderProps {
  eyebrow: string;
  title: ReactNode;
  titleTestId: string;
  description?: ReactNode;
  /** Right-aligned, e.g. the type/status badges on the Person edit form. */
  actions?: ReactNode;
}

/**
 * The eyebrow/title/description header shared by every create/edit form.
 * `title` truncates unconditionally — harmless for a short static title like
 * "New person", necessary for the edit form's `person.name`.
 */
export function FormCardHeader({
  eyebrow,
  title,
  titleTestId,
  description,
  actions,
}: FormCardHeaderProps) {
  return (
    <div className="border-b border-border bg-muted/40 px-6 py-6 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow text-primary">{eyebrow}</p>
          <h1
            className="mt-1.5 truncate font-display text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]"
            data-testid={titleTestId}
          >
            {title}
          </h1>
          {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
        </div>

        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

interface FormCardActionsProps {
  isPending: boolean;
  saveLabel: string;
  saveTestId: string;
  cancelHref: string;
  cancelTestId: string;
}

/** The Save (with pending spinner)/Cancel pair shared by every create/edit form's footer. */
export function FormCardActions({
  isPending,
  saveLabel,
  saveTestId,
  cancelHref,
  cancelTestId,
}: FormCardActionsProps) {
  return (
    <>
      <Button type="submit" data-testid={saveTestId} disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Saving…
          </>
        ) : (
          saveLabel
        )}
      </Button>
      <Button type="button" variant="outline" asChild data-testid={cancelTestId}>
        <Link href={cancelHref}>Cancel</Link>
      </Button>
    </>
  );
}
