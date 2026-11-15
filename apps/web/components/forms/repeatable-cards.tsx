'use client';

import { Plus, Star, Trash2 } from 'lucide-react';
import {
  useFieldArray,
  useFormContext,
  type ArrayPath,
  type FieldArrayPathValue,
  type FieldValues,
  type Path,
} from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** One element of the array at `TName`. */
type Item<TValues extends FieldValues, TName extends ArrayPath<TValues>> = FieldArrayPathValue<
  TValues,
  TName
>[number];

interface RepeatableCardsLabels {
  /** "Address 2" — the card's heading when the item has no title of its own. */
  item: (position: number) => string;
  add: string;
  remove: string;
  primary: string;
  makePrimary: string;
  empty: string;
}

interface RepeatableCardsProps<TValues extends FieldValues, TName extends ArrayPath<TValues>> {
  name: TName;
  /** A new, blank item. `isPrimary` is set for you: the first item is the primary one. */
  newItem: () => Item<TValues, TName>;
  /** The fields of one item; `prefix` is `"<name>.<index>."`, ready for `AddressFields`-like components. */
  renderItem: (prefix: string, index: number) => React.ReactNode;
  /** A heading taken from the item (its label, the contact's name), when it has one. */
  titleOf?: (item: Item<TValues, TName>) => string | undefined;
  labels: RepeatableCardsLabels;
  disabled?: boolean;
  testIdPrefix: string;
}

/**
 * A list of sub-records inside a form — a person's addresses, its contact
 * people — as cards with one primary item. Adding, removing and choosing the
 * primary happen in the form; the API receives the whole list on save and
 * keeps the same rule (exactly one primary) on its side.
 *
 * Each item has an `isPrimary` boolean. The first item added is the primary
 * one; removing the primary hands the role to the first that is left.
 */
export function RepeatableCards<TValues extends FieldValues, TName extends ArrayPath<TValues>>({
  name,
  newItem,
  renderItem,
  titleOf,
  labels,
  disabled = false,
  testIdPrefix,
}: RepeatableCardsProps<TValues, TName>) {
  const form = useFormContext<TValues>();
  const { fields, append, remove } = useFieldArray({ control: form.control, name });
  const items = (form.watch(name as unknown as Path<TValues>) ?? []) as Array<
    Item<TValues, TName> & { isPrimary?: boolean }
  >;

  const primaryPath = (index: number) => `${name}.${index}.isPrimary` as Path<TValues>;

  function setPrimary(target: number, count = items.length) {
    for (let index = 0; index < count; index += 1) {
      form.setValue(primaryPath(index), (index === target) as never, { shouldDirty: true });
    }
  }

  function handleAdd() {
    append({ ...newItem(), isPrimary: fields.length === 0 } as Item<TValues, TName>);
  }

  function handleRemove(index: number) {
    const wasPrimary = items[index]?.isPrimary === true;

    remove(index);

    if (wasPrimary && items.length > 1) {
      setPrimary(0, items.length - 1);
    }
  }

  return (
    <div className="grid gap-4" data-testid={testIdPrefix}>
      {fields.length === 0 ? (
        <p
          className="rounded-md border border-dashed border-border px-4 py-5 text-center text-sm text-text-3"
          data-testid={`${testIdPrefix}-empty`}
        >
          {labels.empty}
        </p>
      ) : null}

      {fields.map((field, index) => {
        const item = items[index];
        const isPrimary = item?.isPrimary === true;
        const title = (item && titleOf?.(item))?.trim() || labels.item(index + 1);

        return (
          <fieldset
            key={field.id}
            className={cn(
              'grid min-w-0 gap-5 rounded-lg border bg-surface p-5 max-sm:p-4',
              isPrimary ? 'border-primary/40' : 'border-border',
            )}
            data-testid={`${testIdPrefix}-item-${index}`}
          >
            <legend className="sr-only">{title}</legend>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="mr-auto truncate text-sm font-semibold" aria-hidden="true">
                {title}
              </h3>
              {isPrimary ? (
                <Badge variant="secondary" data-testid={`${testIdPrefix}-item-${index}-primary`}>
                  <Star aria-hidden="true" className="size-3 fill-current" />
                  {labels.primary}
                </Badge>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  disabled={disabled}
                  onClick={() => setPrimary(index)}
                  data-testid={`${testIdPrefix}-item-${index}-make-primary`}
                >
                  <Star aria-hidden="true" />
                  {labels.makePrimary}
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={disabled}
                aria-label={`${labels.remove}: ${title}`}
                onClick={() => handleRemove(index)}
                data-testid={`${testIdPrefix}-item-${index}-remove`}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
            {renderItem(`${name}.${index}.`, index)}
          </fieldset>
        );
      })}

      {disabled ? null : (
        <div>
          <Button
            type="button"
            variant="create"
            size="sm"
            onClick={handleAdd}
            data-testid={`${testIdPrefix}-add`}
          >
            <Plus aria-hidden="true" />
            {labels.add}
          </Button>
        </div>
      )}
    </div>
  );
}
