'use client';

import { personCreateSchema } from '@oliveira/schemas';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type SubmitEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { personsApi, type ApiResponse, type Person } from '@/lib/api';
import { maskDocument, maskPhone } from '@/lib/masks';

interface PersonFormProps {
  mode: 'create' | 'edit' | 'view';
  personId?: string;
}

interface FormState {
  name: string;
  type: 'CLIENT' | 'SUPPLIER';
  documentType: 'CPF' | 'CNPJ';
  document: string;
  email: string;
  phone: string;
  birthdate: string;
  active: boolean;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  notes: string;
}

const initialState: FormState = {
  name: '',
  type: 'CLIENT',
  documentType: 'CPF',
  document: '',
  email: '',
  phone: '',
  birthdate: '',
  active: true,
  street: '',
  city: '',
  state: '',
  zipCode: '',
  notes: '',
};

export function PersonForm({ mode, personId }: PersonFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(mode !== 'create');
  const readOnly = mode === 'view';

  async function loadPerson(id: string) {
    setLoading(true);
    try {
      const response = await personsApi.get(id);
      const result = (await response.json()) as ApiResponse<Person>;

      if (result.success && result.data) {
        const person = result.data;
        setForm({
          name: person.name,
          type: person.type,
          documentType: person.documentType,
          document: person.document,
          email: person.email ?? '',
          phone: person.phone ?? '',
          birthdate: person.birthdate ? person.birthdate.split('T')[0]! : '',
          active: person.active,
          street: person.street ?? '',
          city: person.city ?? '',
          state: person.state ?? '',
          zipCode: person.zipCode ?? '',
          notes: person.notes ?? '',
        });
      } else {
        toast.error('Failed to load person');
      }
    } catch (error) {
      toast.error('Failed to load person');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if ((mode === 'edit' || mode === 'view') && personId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadPerson(personId);
    }
  }, [mode, personId]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleDocumentTypeChange(value: 'CPF' | 'CNPJ') {
    setForm((current) => ({
      ...current,
      documentType: value,
      document: maskDocument(current.document, value),
    }));
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const payload = {
      name: form.name.trim(),
      type: form.type,
      documentType: form.documentType,
      document: form.document.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      birthdate: form.birthdate || null,
      active: form.active,
      street: form.street.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      zipCode: form.zipCode.trim() || null,
      notes: form.notes.trim() || null,
    };

    const parsed = personCreateSchema.safeParse(payload);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      toast.error('Please fix the errors above');
      return;
    }

    setSubmitting(true);
    try {
      const response =
        mode === 'edit' && personId
          ? await personsApi.update(personId, parsed.data)
          : await personsApi.create(parsed.data);
      const result = (await response.json()) as ApiResponse<{ message: string }>;

      if (result.success) {
        toast.success(mode === 'edit' ? 'Person updated' : 'Person created');
        router.push('/people');
        return;
      }

      toast.error(result.error || 'Failed to save');
    } catch (error) {
      toast.error('Failed to save');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }

  const title = mode === 'edit' ? 'Edit Person' : mode === 'view' ? 'View Person' : 'New Person';

  return (
    <Card
      className="gap-0 rounded-lg p-[var(--spacing-xl)] shadow-card"
      data-testid="person-form-container"
    >
      <h1
        className="mb-[var(--spacing-lg)] text-2xl font-semibold text-foreground"
        data-testid="person-form-title"
      >
        {title}
      </h1>

      {loading ? (
        <div className="flex flex-col gap-[var(--spacing-lg)]" data-testid="person-form-loading">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <form
          className="flex flex-col gap-[var(--spacing-lg)]"
          data-testid="person-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="name" data-testid="person-form-label-name">
              Name *
            </Label>
            <Input
              id="name"
              className="rounded-md shadow-input"
              data-testid="person-form-input-name"
              value={form.name}
              disabled={readOnly}
              onChange={(event) => updateField('name', event.target.value)}
            />
            <p className="text-sm text-destructive" data-testid="person-form-error-name">
              {errors.name}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="type" data-testid="person-form-label-type">
              Type *
            </Label>
            <Select
              value={form.type}
              disabled={readOnly}
              onValueChange={(value: 'CLIENT' | 'SUPPLIER') => updateField('type', value)}
            >
              <SelectTrigger
                id="type"
                className="w-full rounded-md shadow-input"
                data-testid="person-form-input-type"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CLIENT">Client</SelectItem>
                <SelectItem value="SUPPLIER">Supplier</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="documentType" data-testid="person-form-label-document-type">
              Document Type *
            </Label>
            <Select
              value={form.documentType}
              disabled={readOnly}
              onValueChange={handleDocumentTypeChange}
            >
              <SelectTrigger
                id="documentType"
                className="w-full rounded-md shadow-input"
                data-testid="person-form-input-document-type"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CPF">CPF</SelectItem>
                <SelectItem value="CNPJ">CNPJ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="document" data-testid="person-form-label-document">
              Document *
            </Label>
            <Input
              id="document"
              className="rounded-md shadow-input"
              data-testid="person-form-input-document"
              value={form.document}
              disabled={readOnly}
              onChange={(event) =>
                updateField('document', maskDocument(event.target.value, form.documentType))
              }
            />
            <p className="text-sm text-destructive" data-testid="person-form-error-document">
              {errors.document}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email" data-testid="person-form-label-email">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              className="rounded-md shadow-input"
              data-testid="person-form-input-email"
              value={form.email}
              disabled={readOnly}
              onChange={(event) => updateField('email', event.target.value)}
            />
            <p className="text-sm text-destructive" data-testid="person-form-error-email">
              {errors.email}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="phone" data-testid="person-form-label-phone">
              Phone
            </Label>
            <Input
              id="phone"
              className="rounded-md shadow-input"
              data-testid="person-form-input-phone"
              value={form.phone}
              disabled={readOnly}
              onChange={(event) => updateField('phone', maskPhone(event.target.value))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="birthdate" data-testid="person-form-label-birthdate">
              Birthdate
            </Label>
            <Input
              id="birthdate"
              type="date"
              className="rounded-md shadow-input"
              data-testid="person-form-input-birthdate"
              value={form.birthdate}
              disabled={readOnly}
              onChange={(event) => updateField('birthdate', event.target.value)}
            />
          </div>

          <label className="flex w-fit cursor-pointer items-center gap-2">
            <Checkbox
              checked={form.active}
              disabled={readOnly}
              data-testid="person-form-checkbox-active"
              onCheckedChange={(checked) => updateField('active', checked === true)}
            />
            <span className="text-sm text-muted-foreground">Active</span>
          </label>

          <hr className="border-border" />

          <div className="flex flex-col gap-2">
            <Label htmlFor="street" data-testid="person-form-label-street">
              Street
            </Label>
            <Input
              id="street"
              className="rounded-md shadow-input"
              data-testid="person-form-input-street"
              value={form.street}
              disabled={readOnly}
              onChange={(event) => updateField('street', event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="city" data-testid="person-form-label-city">
              City
            </Label>
            <Input
              id="city"
              className="rounded-md shadow-input"
              data-testid="person-form-input-city"
              value={form.city}
              disabled={readOnly}
              onChange={(event) => updateField('city', event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="state" data-testid="person-form-label-state">
              State
            </Label>
            <Input
              id="state"
              className="rounded-md shadow-input"
              data-testid="person-form-input-state"
              value={form.state}
              disabled={readOnly}
              onChange={(event) => updateField('state', event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="zipCode" data-testid="person-form-label-zipcode">
              Zip Code
            </Label>
            <Input
              id="zipCode"
              className="rounded-md shadow-input"
              data-testid="person-form-input-zipcode"
              value={form.zipCode}
              disabled={readOnly}
              onChange={(event) => updateField('zipCode', event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes" data-testid="person-form-label-notes">
              Notes
            </Label>
            <Textarea
              id="notes"
              className="rounded-md shadow-input"
              data-testid="person-form-input-notes"
              rows={3}
              value={form.notes}
              disabled={readOnly}
              onChange={(event) => updateField('notes', event.target.value)}
            />
          </div>

          <div className="flex gap-[var(--spacing-md)]">
            {!readOnly && (
              <Button
                type="submit"
                className="rounded-md bg-primary text-primary-foreground shadow-button hover:bg-primary-hover"
                data-testid="person-form-button-save"
                disabled={submitting}
              >
                Save
              </Button>
            )}
            <Button type="button" variant="outline" asChild data-testid="person-form-button-cancel">
              <Link href="/people">Cancel</Link>
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
