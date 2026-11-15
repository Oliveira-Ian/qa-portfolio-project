'use client';

import { Check } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  emptyAddressFormValues,
  emptyContactFormValues,
  requiresDocument,
  type DocumentType,
  type PersonFormValues,
  type PersonTypeValue,
} from '@oliveira/schemas';
import { AddressFields } from '@/components/forms/address-fields';
import { FormSection } from '@/components/forms/form-section';
import { RepeatableCards } from '@/components/forms/repeatable-cards';
import { PERSON_TYPE_ICON } from '@/components/people/person-badges';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { DatePicker } from '@/components/ui/date-picker';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MaskedInput } from '@/components/ui/masked-input';
import { Textarea } from '@/components/ui/textarea';
import { useT } from '@/lib/i18n/provider';
import { maskDocument, maskPhone } from '@/lib/masks';
import { cn } from '@/lib/utils';

/**
 * A person record's fields — identification, contact (main channels and the
 * contact people), addresses and notes — written once.
 *
 * Create, edit and view all render this — they differ only in what happens on
 * submit and whether the controls accept input, which is a property of the
 * form, not a different form. It replaces ~230 lines of near-identical
 * label/input/error blocks that had drifted far enough apart that nine of the
 * twelve fields had no way to show an error at all.
 *
 * The fields are sections on one page, not tabs: everything a record holds is
 * in sight and one scroll away, an error is never on a tab nobody is looking
 * at, and the save bar (`FormCard`) stays reachable the whole way down.
 * Addresses and contact people are lists of cards (`RepeatableCards`), each
 * with one primary.
 */
interface PersonFormFieldsProps {
  disabled?: boolean;
  /**
   * `customer`: an Oliveira FSM customer — the same record without the ERP's
   * types (a product never sets them, docs/adr/0019), and the document always
   * offered, optional.
   */
  variant?: 'erp' | 'customer';
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2">{children}</div>;
}

/** The padding and the hairline between two sections — one place, so they stay even. */
function SectionBlock({ children }: { children: React.ReactNode }) {
  return <div className="px-6 py-7 max-sm:px-4">{children}</div>;
}

const PERSON_TYPES: PersonTypeValue[] = ['CLIENT', 'SUPPLIER', 'USER', 'EMPLOYEE'];

const PERSON_TYPE_LABEL = {
  CLIENT: 'erp.personType.client',
  SUPPLIER: 'erp.personType.supplier',
  USER: 'erp.personType.user',
  EMPLOYEE: 'erp.personType.employee',
} as const;

const DOCUMENT_TYPE_OPTIONS: ComboboxOption[] = [
  { value: 'CPF', label: 'CPF' },
  { value: 'CNPJ', label: 'CNPJ' },
];

interface TypeChipsProps extends Omit<React.ComponentProps<'div'>, 'onChange'> {
  value: PersonTypeValue[];
  onChange: (value: PersonTypeValue[]) => void;
  disabled?: boolean;
}

/**
 * The person's types as toggle chips. There are four, and a person can hold
 * several at once (a company is a client *and* a supplier), so showing all four
 * with their state beats a dropdown that hides them: one click toggles one, and
 * the document fields that Client/Supplier require appear straight away. A
 * selected chip carries a check as well as the fill — colour is never the only cue.
 *
 * Rendered inside `FormControl`, which hands its `id` and `aria-*` to whatever it
 * wraps, so every extra prop goes on the group.
 */
function TypeChips({ value, onChange, disabled = false, className, ...props }: TypeChipsProps) {
  const t = useT();

  function handleToggle(type: PersonTypeValue) {
    const next = new Set(value);

    if (!next.delete(type)) {
      next.add(type);
    }

    // Always in the canonical order, so the saved array doesn't depend on click order.
    onChange(PERSON_TYPES.filter((candidate) => next.has(candidate)));
  }

  return (
    <div
      role="group"
      aria-label={t('erp.people.form.fields.type')}
      className={cn('flex flex-wrap gap-2', className)}
      {...props}
    >
      {PERSON_TYPES.map((type) => {
        const isSelected = value.includes(type);
        const Icon = isSelected ? Check : PERSON_TYPE_ICON[type];

        return (
          <button
            key={type}
            type="button"
            aria-pressed={isSelected}
            disabled={disabled}
            onClick={() => handleToggle(type)}
            data-testid={`person-form-type-${type.toLowerCase()}`}
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:ring-focus max-md:h-11 [&>svg]:size-4',
              'disabled:cursor-not-allowed disabled:opacity-70',
              isSelected
                ? 'border-primary bg-primary text-primary-foreground hover:bg-primary-hover'
                : 'border-input bg-surface text-text-2 hover:border-input-hover hover:bg-surface-2',
            )}
          >
            <Icon aria-hidden="true" />
            {t(PERSON_TYPE_LABEL[type])}
          </button>
        );
      })}
    </div>
  );
}

/**
 * A person can hold more than one role at once, so this is bound to an array,
 * not a single value — a company can be a client and a supplier on the very
 * same record.
 */
function TypesField({ disabled }: { disabled: boolean }) {
  const t = useT();
  const form = useFormContext<PersonFormValues>();

  return (
    <FormField
      control={form.control}
      name="types"
      render={({ field }) => (
        <FormItem className="sm:col-span-2" required>
          <FormLabel
            help={t('erp.people.form.fields.typeHelp')}
            data-testid="person-form-label-types"
          >
            {t('erp.people.form.fields.type')}
          </FormLabel>
          <FormControl>
            <TypeChips
              value={field.value}
              onChange={field.onChange}
              disabled={disabled}
              data-testid="person-form-types"
            />
          </FormControl>
          <FormMessage data-testid="person-form-error-types" />
        </FormItem>
      )}
    />
  );
}

/**
 * Document type + number only make sense — and are only required — when the
 * person is a CLIENT or SUPPLIER. Hidden rather than merely disabled when not
 * applicable, the same way the view mode hides Save instead of disabling it:
 * a visible-but-pointless field invites confusion about whether it matters.
 */
function DocumentFields({ disabled, optional }: { disabled: boolean; optional: boolean }) {
  const t = useT();
  const form = useFormContext<PersonFormValues>();
  const types = useWatch({ control: form.control, name: 'types' });
  const documentType = useWatch({ control: form.control, name: 'documentType' });

  if (!optional && !requiresDocument(types)) {
    return null;
  }

  return (
    <>
      <FormField
        control={form.control}
        name="documentType"
        render={({ field }) => (
          <FormItem required={!optional}>
            <FormLabel data-testid="person-form-label-document-type">
              {t('erp.people.form.fields.documentType')}
            </FormLabel>
            <FormControl>
              <Combobox
                options={DOCUMENT_TYPE_OPTIONS}
                value={field.value}
                disabled={disabled}
                placeholder={t('erp.people.form.fields.select')}
                onChange={(rawValue: string) => {
                  const value = rawValue as DocumentType;
                  field.onChange(value);
                  // CPF and CNPJ mask differently, so switching type has to
                  // reformat whatever is already typed.
                  form.setValue('document', maskDocument(form.getValues('document'), value), {
                    shouldValidate: form.formState.isSubmitted,
                  });
                }}
                data-testid="person-form-input-document-type"
              />
            </FormControl>
            <FormMessage data-testid="person-form-error-document-type" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="document"
        render={({ field }) => (
          <FormItem required={!optional}>
            <FormLabel data-testid="person-form-label-document">
              {t('erp.people.form.fields.document')}
            </FormLabel>
            <FormControl>
              <MaskedInput
                {...field}
                mask={(rawValue) => maskDocument(rawValue, documentType ?? 'CPF')}
                disabled={disabled}
                inputMode="numeric"
                spellCheck={false}
                autoComplete="off"
                className="tabular"
                placeholder={documentType === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
                data-testid="person-form-input-document"
              />
            </FormControl>
            <FormMessage data-testid="person-form-error-document" />
          </FormItem>
        )}
      />

      {documentType === 'CNPJ' ? <RegistrationFields disabled={disabled} /> : null}
    </>
  );
}

/** A company's state and municipal registrations — asked only when the document is a CNPJ. */
function RegistrationFields({ disabled }: { disabled: boolean }) {
  const t = useT();
  const form = useFormContext<PersonFormValues>();

  return (
    <>
      <FormField
        control={form.control}
        name="stateRegistration"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('erp.people.form.fields.stateRegistration')}</FormLabel>
            <FormControl>
              <Input
                {...field}
                disabled={disabled}
                className="tabular"
                data-testid="person-form-input-state-registration"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="municipalRegistration"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('erp.people.form.fields.municipalRegistration')}</FormLabel>
            <FormControl>
              <Input
                {...field}
                disabled={disabled}
                className="tabular"
                data-testid="person-form-input-municipal-registration"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

/** One contact person: who, what they do there, and how to reach them. */
function ContactItemFields({ prefix, disabled }: { prefix: string; disabled: boolean }) {
  const t = useT();
  const form = useFormContext<PersonFormValues>();
  const name = (field: string) => `${prefix}${field}` as Parameters<typeof form.register>[0];
  const testId = (field: string) => `person-form-${prefix.replaceAll('.', '-')}${field}`;

  return (
    <FieldGrid>
      <FormField
        control={form.control}
        name={name('name')}
        render={({ field }) => (
          <FormItem required>
            <FormLabel>{t('common.contact.name')}</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={String(field.value ?? '')}
                disabled={disabled}
                autoComplete="off"
                data-testid={testId('name')}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={name('role')}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('common.contact.role')}</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={String(field.value ?? '')}
                disabled={disabled}
                placeholder={t('common.contact.rolePlaceholder')}
                data-testid={testId('role')}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={name('email')}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('common.contact.email')}</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={String(field.value ?? '')}
                type="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                disabled={disabled}
                data-testid={testId('email')}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          control={form.control}
          name={name('phone')}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('common.contact.phone')}</FormLabel>
              <FormControl>
                <MaskedInput
                  {...field}
                  value={String(field.value ?? '')}
                  mask={maskPhone}
                  type="tel"
                  inputMode="tel"
                  className="tabular"
                  disabled={disabled}
                  data-testid={testId('phone')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={name('mobile')}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('common.contact.mobile')}</FormLabel>
              <FormControl>
                <MaskedInput
                  {...field}
                  value={String(field.value ?? '')}
                  mask={maskPhone}
                  type="tel"
                  inputMode="tel"
                  className="tabular"
                  disabled={disabled}
                  data-testid={testId('mobile')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name={name('notes')}
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>{t('common.contact.notes')}</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={String(field.value ?? '')}
                disabled={disabled}
                data-testid={testId('notes')}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </FieldGrid>
  );
}

export function PersonFormFields({ disabled = false, variant = 'erp' }: PersonFormFieldsProps) {
  const t = useT();
  const form = useFormContext<PersonFormValues>();

  return (
    <div className="divide-y divide-border">
      <SectionBlock>
        <FormSection
          id="person-section-identification"
          data-testid="person-form-section-identification"
          title={t('erp.people.form.sections.identification.title')}
          description={t(
            variant === 'customer'
              ? 'fsm.customers.form.identificationBody'
              : 'erp.people.form.sections.identification.body',
          )}
        >
          <FieldGrid>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="sm:col-span-2" required>
                  <FormLabel
                    help={t('erp.people.form.fields.nameHelp')}
                    data-testid="person-form-label-name"
                  >
                    {t('erp.people.form.fields.name')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={disabled}
                      autoComplete="organization"
                      placeholder={t('erp.people.form.fields.namePlaceholder')}
                      data-testid="person-form-input-name"
                    />
                  </FormControl>
                  <FormMessage data-testid="person-form-error-name" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tradeName"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel help={t('erp.people.form.fields.tradeNameHelp')}>
                    {t('erp.people.form.fields.tradeName')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={disabled}
                      autoComplete="off"
                      data-testid="person-form-input-trade-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {variant === 'erp' ? <TypesField disabled={disabled} /> : null}
            <DocumentFields disabled={disabled} optional={variant === 'customer'} />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <label className="flex w-fit cursor-pointer items-center gap-2.5 py-1 text-sm text-foreground">
                    <Checkbox
                      checked={field.value}
                      disabled={disabled}
                      data-testid="person-form-checkbox-active"
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                    {t('erp.people.form.fields.active')}
                  </label>
                </FormItem>
              )}
            />
          </FieldGrid>
        </FormSection>
      </SectionBlock>

      <SectionBlock>
        <FormSection
          id="person-section-contact"
          data-testid="person-form-section-contact"
          title={t('erp.people.form.sections.contact.title')}
          description={t('erp.people.form.sections.contact.body')}
          optionalLabel={t('erp.people.form.optional')}
        >
          <FieldGrid>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel data-testid="person-form-label-email">
                    {t('erp.people.form.fields.email')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      disabled={disabled}
                      autoComplete="email"
                      inputMode="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="contact@example.com"
                      data-testid="person-form-input-email"
                    />
                  </FormControl>
                  <FormMessage data-testid="person-form-error-email" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel data-testid="person-form-label-phone">
                    {t('erp.people.form.fields.phone')}
                  </FormLabel>
                  <FormControl>
                    <MaskedInput
                      {...field}
                      mask={maskPhone}
                      type="tel"
                      disabled={disabled}
                      autoComplete="tel"
                      inputMode="tel"
                      className="tabular"
                      placeholder="(11) 3456-7890"
                      data-testid="person-form-input-phone"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('erp.people.form.fields.mobile')}</FormLabel>
                  <FormControl>
                    <MaskedInput
                      {...field}
                      mask={maskPhone}
                      type="tel"
                      disabled={disabled}
                      autoComplete="tel"
                      inputMode="tel"
                      className="tabular"
                      placeholder="(11) 98765-4321"
                      data-testid="person-form-input-mobile"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birthdate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel data-testid="person-form-label-birthdate">
                    {t('erp.people.form.fields.birthdate')}
                  </FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      disabled={disabled}
                      placeholder={t('erp.people.form.fields.pickDate')}
                      data-testid="person-form-input-birthdate"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </FieldGrid>
        </FormSection>
      </SectionBlock>

      <SectionBlock>
        <FormSection
          id="person-section-contacts"
          data-testid="person-form-section-contacts"
          title={t('erp.people.form.sections.contacts.title')}
          description={t('erp.people.form.sections.contacts.body')}
          optionalLabel={t('erp.people.form.optional')}
        >
          <RepeatableCards<PersonFormValues, 'contacts'>
            name="contacts"
            newItem={() => emptyContactFormValues()}
            titleOf={(item) => item.name}
            disabled={disabled}
            testIdPrefix="person-form-contacts"
            labels={{
              item: (position) => t('common.contact.list.item', { position }),
              add: t('common.contact.list.add'),
              remove: t('common.contact.list.remove'),
              primary: t('common.contact.list.primary'),
              makePrimary: t('common.contact.list.makePrimary'),
              empty: t('common.contact.list.empty'),
            }}
            renderItem={(prefix) => <ContactItemFields prefix={prefix} disabled={disabled} />}
          />
        </FormSection>
      </SectionBlock>

      <SectionBlock>
        <FormSection
          id="person-section-address"
          data-testid="person-form-section-address"
          title={t('erp.people.form.sections.address.title')}
          description={t('erp.people.form.sections.address.body')}
          optionalLabel={t('erp.people.form.optional')}
        >
          <RepeatableCards<PersonFormValues, 'addresses'>
            name="addresses"
            newItem={() => emptyAddressFormValues()}
            titleOf={(item) => item.label}
            disabled={disabled}
            testIdPrefix="person-form-addresses"
            labels={{
              item: (position) => t('common.address.list.item', { position }),
              add: t('common.address.list.add'),
              remove: t('common.address.list.remove'),
              primary: t('common.address.list.primary'),
              makePrimary: t('common.address.list.makePrimary'),
              empty: t('common.address.list.empty'),
            }}
            renderItem={(prefix, index) => (
              <AddressFields<PersonFormValues>
                prefix={prefix}
                disabled={disabled}
                withDetails
                testIdPrefix={`person-form-address-${index}`}
              />
            )}
          />
        </FormSection>
      </SectionBlock>

      <SectionBlock>
        <FormSection
          id="person-section-notes"
          data-testid="person-form-section-notes"
          title={t('erp.people.form.sections.notes.title')}
          description={t('erp.people.form.sections.notes.body')}
          optionalLabel={t('erp.people.form.optional')}
        >
          <FieldGrid>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel data-testid="person-form-label-notes">
                    {t('erp.people.form.fields.notes')}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      disabled={disabled}
                      placeholder={t('erp.people.form.fields.notesPlaceholder')}
                      data-testid="person-form-input-notes"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </FieldGrid>
        </FormSection>
      </SectionBlock>
    </div>
  );
}
