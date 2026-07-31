'use client';

import { useTransition } from 'react';
import { useForm, type DefaultValues, type FieldValues, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';
import type { ActionResult } from '@/lib/actions';

type SubmitResult = ActionResult | void;

/**
 * Everything a create/edit form shares: schema-driven validation, the same
 * "fix the errors above" toast, and the same pending state — only the
 * resolver, defaults and which Server Action to call differ per entity. Used
 * by every entity form in the app (Person, Profile, …) instead of each one
 * carrying its own near-identical hook.
 *
 * Takes an already-built `Resolver<TValues>` (`zodResolver(someSchema)`)
 * rather than the schema itself: `zodResolver` on a schema typed through a
 * generic `TValues` doesn't resolve to a usable `Resolver<TValues>` overload,
 * since Zod's own generic input/output types stay abstract. Building the
 * resolver at the call site — where the schema is concrete — sidesteps that
 * entirely, and is also where a schema field with a `.default(...)` (e.g.
 * `profileWriteSchema.permissionIds`) already needs its own
 * `as Resolver<TValues>` cast under this project's `exactOptionalPropertyTypes`.
 *
 * `useTransition` rather than a `submitting` boolean: React keeps the form
 * interactive while the action runs and the pending flag comes for free.
 */
export function useEntityForm<TValues extends FieldValues>(
  resolver: Resolver<TValues, unknown, TValues>,
  defaultValues: TValues,
  submit: (values: TValues) => Promise<SubmitResult>,
) {
  const [isPending, startTransition] = useTransition();

  // All three type args pinned explicitly: left to inference/defaults, a
  // generic `TValues` (rather than a concrete object type) doesn't propagate
  // through `TTransformedValues`'s own default expression the way a concrete
  // type does, and TypeScript falls back to a fresh, unresolved `TFieldValues`
  // instead of reusing `TValues`. `defaultValues` needs its own cast for the
  // same reason: `DefaultValues<T>` is a mapped type that doesn't simplify
  // back to plain `T` when `T` is still an abstract generic rather than a
  // concrete object shape — harmless, since every call site really does pass
  // a `TValues`-shaped object.
  const form = useForm<TValues, unknown, TValues>({
    resolver,
    defaultValues: defaultValues as DefaultValues<TValues>,
  });

  const onSubmit = form.handleSubmit(
    (values) => {
      startTransition(async () => {
        // A successful action redirects, so nothing comes back to handle.
        const result = await submit(values);

        if (result?.success === false) {
          toast.error(result.message);
        }
      });
    },
    () => {
      toast.error('Please fix the errors above');
    },
  );

  return { form, isPending, onSubmit };
}
