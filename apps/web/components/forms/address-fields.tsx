'use client';

import { useFormContext, type FieldValues, type Path } from 'react-hook-form';
import { Combobox } from '@/components/ui/combobox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MaskedInput } from '@/components/ui/masked-input';
import { BRAZILIAN_STATES } from '@/lib/brazilian-states';
import { useT } from '@/lib/i18n/provider';
import { maskZipCode } from '@/lib/masks';

interface AddressFieldsProps {
  /** Path in front of each field — `''` for a flat form, `'addresses.0.'` for one of a list. */
  prefix?: string;
  disabled?: boolean;
  /** Prefix for each control's `data-testid`. */
  testIdPrefix: string;
}

/**
 * A Brazilian address — CEP, street, number, complement, district, city and
 * state — laid out the same way wherever an address is typed: the company's,
 * a branch's, a person's. Every field is optional here; the schema says what
 * a given record requires.
 */
export function AddressFields<TValues extends FieldValues>({
  prefix = '',
  disabled = false,
  testIdPrefix,
}: AddressFieldsProps) {
  const t = useT();
  const form = useFormContext<TValues>();
  const name = (field: string) => `${prefix}${field}` as Path<TValues>;

  return (
    <div className="grid gap-5 sm:grid-cols-6">
      <FormField
        control={form.control}
        name={name('zipCode')}
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>{t('common.address.zipCode')}</FormLabel>
            <FormControl>
              <MaskedInput
                {...field}
                value={String(field.value ?? '')}
                mask={maskZipCode}
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="00000-000"
                disabled={disabled}
                data-testid={`${testIdPrefix}-zipcode`}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={name('street')}
        render={({ field }) => (
          <FormItem className="sm:col-span-4">
            <FormLabel>{t('common.address.street')}</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={String(field.value ?? '')}
                autoComplete="address-line1"
                disabled={disabled}
                data-testid={`${testIdPrefix}-street`}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={name('number')}
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>{t('common.address.number')}</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={String(field.value ?? '')}
                disabled={disabled}
                data-testid={`${testIdPrefix}-number`}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={name('complement')}
        render={({ field }) => (
          <FormItem className="sm:col-span-4">
            <FormLabel>{t('common.address.complement')}</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={String(field.value ?? '')}
                autoComplete="address-line2"
                disabled={disabled}
                data-testid={`${testIdPrefix}-complement`}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={name('district')}
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>{t('common.address.district')}</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={String(field.value ?? '')}
                disabled={disabled}
                data-testid={`${testIdPrefix}-district`}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={name('city')}
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>{t('common.address.city')}</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={String(field.value ?? '')}
                autoComplete="address-level2"
                disabled={disabled}
                data-testid={`${testIdPrefix}-city`}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={name('state')}
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>{t('common.address.state')}</FormLabel>
            <FormControl>
              <Combobox
                options={BRAZILIAN_STATES}
                value={field.value ? String(field.value) : null}
                onChange={field.onChange}
                placeholder={t('common.address.statePlaceholder')}
                searchPlaceholder={t('common.address.stateSearch')}
                emptyText={t('common.address.stateEmpty')}
                disabled={disabled}
                data-testid={`${testIdPrefix}-state`}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
