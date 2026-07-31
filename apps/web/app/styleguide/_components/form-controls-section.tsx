'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DatePicker } from '@/components/ui/date-picker';
import { DateRangePicker, type DateRangeValue } from '@/components/ui/date-range-picker';
import { FileUpload } from '@/components/ui/file-upload';
import { ImageInput } from '@/components/ui/image-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MaskedInput } from '@/components/ui/masked-input';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
import { NumberInput } from '@/components/ui/number-input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { TimeInput } from '@/components/ui/time-input';
import { maskPhone } from '@/lib/masks';
import { ComponentDemo, StyleguideSection } from './section-shell';

const FRUIT_OPTIONS: ComboboxOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];

const TYPE_OPTIONS: MultiSelectOption[] = [
  { value: 'client', label: 'Client', tone: 'primary' },
  { value: 'supplier', label: 'Supplier', tone: 'signal' },
  { value: 'employee', label: 'Employee', tone: 'neutral' },
];

function ComboboxDemo() {
  const [value, setValue] = useState<string | null>(null);

  return (
    <Combobox
      options={FRUIT_OPTIONS}
      value={value}
      onChange={setValue}
      placeholder="Select a fruit…"
      data-testid="styleguide-combobox"
    />
  );
}

function MultiSelectDemo() {
  const [value, setValue] = useState<string[]>(['client', 'supplier']);

  return (
    <MultiSelect
      options={TYPE_OPTIONS}
      value={value}
      onChange={setValue}
      data-testid="styleguide-multiselect"
    />
  );
}

function MaskedInputDemo() {
  const [value, setValue] = useState('');

  return (
    <MaskedInput
      value={value}
      onChange={setValue}
      mask={maskPhone}
      placeholder="(11) 98765-4321"
      inputMode="tel"
    />
  );
}

function NumberInputDemo() {
  const [value, setValue] = useState<number | null>(120);

  return <NumberInput value={value} onChange={setValue} />;
}

function CurrencyInputDemo() {
  const [value, setValue] = useState<number | null>(1234.56);

  return <CurrencyInput value={value} onChange={setValue} />;
}

function TimeInputDemo() {
  const [value, setValue] = useState('09:30');

  return <TimeInput value={value} onChange={setValue} />;
}

function DatePickerDemo() {
  const [value, setValue] = useState('');

  return <DatePicker value={value} onChange={setValue} />;
}

function DateRangePickerDemo() {
  const [value, setValue] = useState<DateRangeValue>({ from: '', to: '' });

  return <DateRangePicker value={value} onChange={setValue} />;
}

function FileUploadDemo() {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <FileUpload value={files} onChange={setFiles} multiple hint="PNG or PDF, up to 5MB each" />
  );
}

function ImageInputDemo() {
  const [image, setImage] = useState<File | string | null>(null);

  return <ImageInput value={image} onChange={setImage} hint="Square image, up to 2MB" />;
}

export function FormControlsSection() {
  return (
    <StyleguideSection
      id="form-controls"
      title="Form controls"
      description="Every field in this app validates with Zod and renders through react-hook-form's Controller — see components/forms/ and packages/schemas."
    >
      <ComponentDemo id="form-controls-input" title="Input">
        <div className="grid max-w-md gap-4">
          <div className="grid gap-2">
            <Label htmlFor="styleguide-input-default">Name</Label>
            <Input id="styleguide-input-default" placeholder="Construtora Vale Verde" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="styleguide-input-invalid">Email (invalid)</Label>
            <Input
              id="styleguide-input-invalid"
              defaultValue="not-an-email"
              aria-invalid
              type="email"
            />
            <p className="text-sm text-destructive">Invalid email</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="styleguide-input-disabled">Disabled</Label>
            <Input id="styleguide-input-disabled" defaultValue="Read only" disabled />
          </div>
        </div>
      </ComponentDemo>

      <ComponentDemo id="form-controls-textarea" title="Textarea">
        <div className="max-w-md">
          <Textarea rows={3} placeholder="Anything the team should know about this record…" />
        </div>
      </ComponentDemo>

      <ComponentDemo
        id="form-controls-checkbox"
        title="Checkbox"
        description="Also supports an indeterminate state, for a &ldquo;select all&rdquo; header when only some rows are checked."
      >
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox defaultChecked={false} /> Unchecked
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox defaultChecked /> Checked
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox checked="indeterminate" /> Indeterminate
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox disabled /> Disabled
          </label>
        </div>
      </ComponentDemo>

      <ComponentDemo id="form-controls-radio-group" title="Radio group">
        <RadioGroup defaultValue="cpf" className="w-fit gap-3">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <RadioGroupItem value="cpf" /> CPF
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <RadioGroupItem value="cnpj" /> CNPJ
          </label>
        </RadioGroup>
      </ComponentDemo>

      <ComponentDemo id="form-controls-switch" title="Switch">
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <Switch defaultChecked /> Active record
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <Switch size="sm" /> Small
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch disabled /> Disabled
          </label>
        </div>
      </ComponentDemo>

      <ComponentDemo id="form-controls-slider" title="Slider">
        <div className="max-w-md">
          <Slider defaultValue={[40]} max={100} step={1} />
        </div>
      </ComponentDemo>

      <ComponentDemo
        id="form-controls-combobox"
        title="Combobox"
        description="The standard for a single-select form field — searchable, and its trigger is the same 40px height as every other field. For state (27 options) or document type, this is what to reach for."
      >
        <div className="w-64">
          <ComboboxDemo />
        </div>
      </ComponentDemo>

      <ComponentDemo
        id="form-controls-select"
        title="Select"
        description="Not for a form field — reserved for compact, low-cardinality pickers embedded in dense UI, where the smaller 32px height matches its surroundings: the pagination page-size control, a Role editor in a table cell, a column filter's Any/Yes/No. A short, un-searched list in that kind of spot doesn't need Combobox's search box."
      >
        <Select defaultValue="cpf">
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cpf">CPF</SelectItem>
            <SelectItem value="cnpj">CNPJ</SelectItem>
          </SelectContent>
        </Select>
      </ComponentDemo>

      <ComponentDemo
        id="form-controls-multi-select"
        title="Multi-select"
        description="A selected tag's color is optional and per-option (tone: 'primary' | 'signal' | 'success' | 'destructive' | 'neutral', the same soft tints PersonTypeBadge uses) — the remove control sits inside the tag itself, not next to it."
      >
        <div className="w-72">
          <MultiSelectDemo />
        </div>
      </ComponentDemo>

      <ComponentDemo
        id="form-controls-masked-input"
        title="Masked input"
        description="Wraps Input with a pure formatter (lib/masks.ts) — every keystroke is reshaped before it reaches state."
      >
        <div className="w-64">
          <MaskedInputDemo />
        </div>
      </ComponentDemo>

      <ComponentDemo
        id="form-controls-number-input"
        title="Number input"
        description="Digits typed shift the value like a calculator display — no decimal point to place by hand."
      >
        <div className="w-48">
          <NumberInputDemo />
        </div>
      </ComponentDemo>

      <ComponentDemo id="form-controls-currency-input" title="Currency input">
        <div className="w-48">
          <CurrencyInputDemo />
        </div>
      </ComponentDemo>

      <ComponentDemo id="form-controls-time-input" title="Time input">
        <div className="w-40">
          <TimeInputDemo />
        </div>
      </ComponentDemo>

      <ComponentDemo id="form-controls-date-picker" title="Date picker">
        <div className="w-56">
          <DatePickerDemo />
        </div>
      </ComponentDemo>

      <ComponentDemo id="form-controls-date-range-picker" title="Date range picker">
        <div className="w-72">
          <DateRangePickerDemo />
        </div>
      </ComponentDemo>

      <ComponentDemo id="form-controls-file-upload" title="File upload">
        <div className="max-w-md">
          <FileUploadDemo />
        </div>
      </ComponentDemo>

      <ComponentDemo id="form-controls-image-input" title="Image input">
        <ImageInputDemo />
      </ComponentDemo>
    </StyleguideSection>
  );
}
