'use client';

import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  requiresDocument,
  type DocumentType,
  type PersonFormValues,
  type PersonTypeValue,
} from '@oliveira/schemas';
import { PersonTypeBadge } from '@/components/people/person-badges';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { DatePicker } from '@/components/ui/date-picker';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MaskedInput } from '@/components/ui/masked-input';
import { MultiSelect } from '@/components/ui/multi-select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { maskDocument, maskPhone } from '@/lib/masks';

/**
 * The 12 fields of a person record, written once.
 *
 * Create, edit and view all render this — they differ only in what happens on
 * submit and whether the controls accept input, which is a property of the
 * form, not a different form. It replaces ~230 lines of near-identical
 * label/input/error blocks that had drifted far enough apart that nine of the
 * twelve fields had no way to show an error at all.
 */
interface PersonFormFieldsProps {
  disabled?: boolean;
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 pt-1 sm:grid-cols-2">{children}</div>;
}

const PERSON_TYPE_OPTIONS: { value: PersonTypeValue; label: string }[] = [
  { value: 'CLIENT', label: 'Client' },
  { value: 'SUPPLIER', label: 'Supplier' },
  { value: 'USER', label: 'User' },
  { value: 'EMPLOYEE', label: 'Employee' },
];

const DOCUMENT_TYPE_OPTIONS: ComboboxOption[] = [
  { value: 'CPF', label: 'CPF' },
  { value: 'CNPJ', label: 'CNPJ' },
];

/** The 26 states plus the Federal District, by their standard two-letter code. */
const BRAZILIAN_STATES: ComboboxOption[] = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
];

type PersonFormTab = 'identification' | 'contact' | 'address' | 'notes';

/** Which tab each field lives on — used to jump to the first invalid tab on a failed submit. */
const TAB_FIELDS: Record<PersonFormTab, (keyof PersonFormValues)[]> = {
  identification: ['name', 'types', 'documentType', 'document'],
  contact: ['email', 'phone', 'birthdate', 'active'],
  address: ['street', 'city', 'state', 'zipCode'],
  notes: ['notes'],
};

const TAB_ORDER: PersonFormTab[] = ['identification', 'contact', 'address', 'notes'];

/**
 * A person can hold more than one role at once, so this is a multi-select
 * bound to an array, not a single-select — a company can be a client and a
 * supplier on the very same record.
 */
function TypesField({ disabled }: { disabled: boolean }) {
  const form = useFormContext<PersonFormValues>();

  return (
    <FormField
      control={form.control}
      name="types"
      render={({ field }) => (
        <FormItem className="sm:col-span-2">
          <FormLabel data-testid="person-form-label-types">Type</FormLabel>
          <FormControl>
            <MultiSelect
              options={PERSON_TYPE_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              disabled={disabled}
              placeholder="Select…"
              renderTag={(option, onRemove) => (
                <PersonTypeBadge type={option.value as PersonTypeValue} onRemove={onRemove} />
              )}
              data-testid="person-form-multiselect-types"
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
function DocumentFields({ disabled }: { disabled: boolean }) {
  const form = useFormContext<PersonFormValues>();
  const types = useWatch({ control: form.control, name: 'types' });
  const documentType = useWatch({ control: form.control, name: 'documentType' });

  if (!requiresDocument(types)) {
    return null;
  }

  return (
    <>
      <FormField
        control={form.control}
        name="documentType"
        render={({ field }) => (
          <FormItem>
            <FormLabel data-testid="person-form-label-document-type">Document type</FormLabel>
            <FormControl>
              <Combobox
                options={DOCUMENT_TYPE_OPTIONS}
                value={field.value}
                disabled={disabled}
                placeholder="Select…"
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
          <FormItem className="sm:col-span-2">
            <FormLabel data-testid="person-form-label-document">Document</FormLabel>
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
    </>
  );
}

export function PersonFormFields({ disabled = false }: PersonFormFieldsProps) {
  const form = useFormContext<PersonFormValues>();
  const [activeTab, setActiveTab] = useState<PersonFormTab>('identification');

  // Jump to the first tab holding an invalid field, once per submit attempt —
  // adjusted during render (React's documented alternative to an effect for
  // "derive state from a value that just changed") rather than in a
  // `useEffect`, so fixing one field doesn't yank the user back on every
  // keystroke afterward.
  const [handledSubmitCount, setHandledSubmitCount] = useState(0);
  const { submitCount, errors } = form.formState;

  if (submitCount !== handledSubmitCount) {
    setHandledSubmitCount(submitCount);

    const erroredTab = TAB_ORDER.find((tab) => TAB_FIELDS[tab].some((field) => errors[field]));

    if (erroredTab) {
      setActiveTab(erroredTab);
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PersonFormTab)}>
      <TabsList>
        <TabsTrigger value="identification" data-testid="person-form-tab-identification">
          Identification
        </TabsTrigger>
        <TabsTrigger value="contact" data-testid="person-form-tab-contact">
          Contact
        </TabsTrigger>
        <TabsTrigger value="address" data-testid="person-form-tab-address">
          Address
        </TabsTrigger>
        <TabsTrigger value="notes" data-testid="person-form-tab-notes">
          Notes
        </TabsTrigger>
      </TabsList>

      <TabsContent value="identification" className="mt-5">
        <FieldGrid>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel data-testid="person-form-label-name">Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={disabled}
                    autoComplete="organization"
                    placeholder="Construtora Vale Verde"
                    data-testid="person-form-input-name"
                  />
                </FormControl>
                <FormMessage data-testid="person-form-error-name" />
              </FormItem>
            )}
          />

          <TypesField disabled={disabled} />
          <DocumentFields disabled={disabled} />
        </FieldGrid>
      </TabsContent>

      <TabsContent value="contact" className="mt-5">
        <FieldGrid>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-testid="person-form-label-email">Email</FormLabel>
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
                <FormLabel data-testid="person-form-label-phone">Phone</FormLabel>
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
                    data-testid="person-form-input-phone"
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
                <FormLabel data-testid="person-form-label-birthdate">Birthdate</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    disabled={disabled}
                    placeholder="Select a date…"
                    data-testid="person-form-input-birthdate"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="justify-end">
                <label className="flex w-fit cursor-pointer items-center gap-2.5 py-2 text-sm text-foreground">
                  <Checkbox
                    checked={field.value}
                    disabled={disabled}
                    data-testid="person-form-checkbox-active"
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                  Active record
                </label>
              </FormItem>
            )}
          />
        </FieldGrid>
      </TabsContent>

      <TabsContent value="address" className="mt-5">
        <FieldGrid>
          <FormField
            control={form.control}
            name="street"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel data-testid="person-form-label-street">Street</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={disabled}
                    autoComplete="street-address"
                    data-testid="person-form-input-street"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-testid="person-form-label-city">City</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={disabled}
                    autoComplete="address-level2"
                    data-testid="person-form-input-city"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-testid="person-form-label-state">State</FormLabel>
                <FormControl>
                  <Combobox
                    options={BRAZILIAN_STATES}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={disabled}
                    placeholder="Select…"
                    data-testid="person-form-input-state"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="zipCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-testid="person-form-label-zipcode">Zip code</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={disabled}
                    autoComplete="postal-code"
                    inputMode="numeric"
                    className="tabular"
                    data-testid="person-form-input-zipcode"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </FieldGrid>
      </TabsContent>

      <TabsContent value="notes" className="mt-5">
        <FieldGrid>
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel data-testid="person-form-label-notes">Notes</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={3}
                    disabled={disabled}
                    placeholder="Anything the team should know about this record…"
                    data-testid="person-form-input-notes"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </FieldGrid>
      </TabsContent>
    </Tabs>
  );
}
