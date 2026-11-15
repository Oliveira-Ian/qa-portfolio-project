'use client';

import { useFormContext, type FieldValues, type Path } from 'react-hook-form';
import { ADDRESS_TYPES, type AddressType } from '@oliveira/schemas';
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
  /**
   * One address among several (a person's): adds its type and label at the top
   * and a reference point at the bottom. A single address (the company's) has none.
   */
  withDetails?: boolean;
  /** Oliveira FSM: when the site receives technicians (`serviceHours`), after the reference point. */
  withServiceHours?: boolean;
}

export const ADDRESS_TYPE_LABEL: Record<AddressType, `common.address.types.${AddressType}`> = {
  COMMERCIAL: 'common.address.types.COMMERCIAL',
  RESIDENTIAL: 'common.address.types.RESIDENTIAL',
  BILLING: 'common.address.types.BILLING',
  SERVICE: 'common.address.types.SERVICE',
  DELIVERY: 'common.address.types.DELIVERY',
  OTHER: 'common.address.types.OTHER',
};

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
  withDetails = false,
  withServiceHours = false,
}: AddressFieldsProps) {
  const t = useT();
  const form = useFormContext<TValues>();
  const name = (field: string) => `${prefix}${field}` as Path<TValues>;
  const typeOptions = ADDRESS_TYPES.map((type) => ({
    value: type,
    label: t(ADDRESS_TYPE_LABEL[type]),
  }));

  return (
    <div className="grid gap-5 sm:grid-cols-6">
      {withDetails ? (
        <>
          <FormField
            control={form.control}
            name={name('type')}
            render={({ field }) => (
              <FormItem className="sm:col-span-2" required>
                <FormLabel>{t('common.address.type')}</FormLabel>
                <FormControl>
                  <Combobox
                    options={typeOptions}
                    value={field.value ? String(field.value) : null}
                    onChange={field.onChange}
                    placeholder={t('common.address.statePlaceholder')}
                    disabled={disabled}
                    data-testid={`${testIdPrefix}-type`}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={name('label')}
            render={({ field }) => (
              <FormItem className="sm:col-span-4">
                <FormLabel>{t('common.address.label')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={String(field.value ?? '')}
                    placeholder={t('common.address.labelPlaceholder')}
                    disabled={disabled}
                    data-testid={`${testIdPrefix}-label`}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      ) : null}
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
      {withDetails ? (
        <FormField
          control={form.control}
          name={name('reference')}
          render={({ field }) => (
            <FormItem className="sm:col-span-6">
              <FormLabel>{t('common.address.reference')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={String(field.value ?? '')}
                  placeholder={t('common.address.referencePlaceholder')}
                  disabled={disabled}
                  data-testid={`${testIdPrefix}-reference`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
      {withServiceHours ? (
        <FormField
          control={form.control}
          name={name('serviceHours')}
          render={({ field }) => (
            <FormItem className="sm:col-span-6">
              <FormLabel>{t('common.address.serviceHours')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={String(field.value ?? '')}
                  placeholder={t('common.address.serviceHoursPlaceholder')}
                  disabled={disabled}
                  data-testid={`${testIdPrefix}-service-hours`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
    </div>
  );
}
