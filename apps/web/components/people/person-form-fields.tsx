'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import {
  requiresDocument,
  type DocumentType,
  type PersonFormValues,
  type PersonTypeValue,
} from '@oliveira/schemas';
import { PersonTypeBadge } from '@/components/people/person-badges';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="eyebrow text-muted-foreground">{title}</legend>
      <div className="measured-rule mt-2 mb-5" aria-hidden="true" />
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

const PERSON_TYPE_OPTIONS: { value: PersonTypeValue; label: string }[] = [
  { value: 'CLIENT', label: 'Client' },
  { value: 'SUPPLIER', label: 'Supplier' },
  { value: 'USER', label: 'User' },
  { value: 'EMPLOYEE', label: 'Employee' },
];

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
              renderTag={(option) => <PersonTypeBadge type={option.value as PersonTypeValue} />}
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
            <Select
              value={field.value ?? ''}
              disabled={disabled}
              onValueChange={(value: DocumentType) => {
                field.onChange(value);
                // CPF and CNPJ mask differently, so switching type has to
                // reformat whatever is already typed.
                form.setValue('document', maskDocument(form.getValues('document'), value), {
                  shouldValidate: form.formState.isSubmitted,
                });
              }}
            >
              <FormControl>
                <SelectTrigger className="w-full" data-testid="person-form-input-document-type">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="CPF">CPF</SelectItem>
                <SelectItem value="CNPJ">CNPJ</SelectItem>
              </SelectContent>
            </Select>
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
              <Input
                {...field}
                disabled={disabled}
                inputMode="numeric"
                spellCheck={false}
                autoComplete="off"
                className="tabular"
                placeholder={documentType === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
                data-testid="person-form-input-document"
                onChange={(event) =>
                  field.onChange(maskDocument(event.target.value, documentType ?? 'CPF'))
                }
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

  return (
    <div className="flex flex-col gap-8">
      <FieldGroup title="Identification">
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
      </FieldGroup>

      <FieldGroup title="Contact">
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
                <Input
                  {...field}
                  type="tel"
                  disabled={disabled}
                  autoComplete="tel"
                  inputMode="tel"
                  className="tabular"
                  placeholder="(11) 98765-4321"
                  data-testid="person-form-input-phone"
                  onChange={(event) => field.onChange(maskPhone(event.target.value))}
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
                <Input
                  {...field}
                  type="date"
                  disabled={disabled}
                  autoComplete="bday"
                  className="tabular"
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
      </FieldGroup>

      <FieldGroup title="Address">
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
                <Input
                  {...field}
                  disabled={disabled}
                  autoComplete="address-level1"
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
      </FieldGroup>

      <FieldGroup title="Notes">
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
      </FieldGroup>
    </div>
  );
}
