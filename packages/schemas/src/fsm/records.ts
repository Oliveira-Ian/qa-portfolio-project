import { z } from 'zod';
import type { AddressDto } from '../address.js';
import { maxLengthMessage } from '../messages.js';
import { paginationQuerySchema, sortQuerySchema } from '../pagination.js';
import type { Person } from '../person.js';

/**
 * Oliveira FSM's base records (plan § 2.5): customers, equipment, products and
 * services, work order types. One schema per record serves the API and the
 * form: optional text is `''`, and the API stores it as `null`.
 */
const text = (max: number) => z.string().trim().max(max, maxLengthMessage(max));
const required = (message: string, max: number) =>
  z.string().trim().min(1, message).max(max, maxLengthMessage(max));

/** `''` or a calendar day, `yyyy-mm-dd` — what `<input type="date">` and `DatePicker` hold. */
const calendarDay = z
  .string()
  .trim()
  .refine((value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value), 'Invalid date');

/** Every FSM list takes the same query: search, pagination, sorting, and `f_*` column filters. */
export const fsmListQuerySchema = z
  .object({ search: z.string().trim().optional() })
  .extend(paginationQuerySchema.shape)
  .extend(sortQuerySchema.shape);

export type FsmListQuery = z.infer<typeof fsmListQuerySchema>;

/* -------------------------------------------------------------------------- */
/* Customers                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * A customer of the FSM: a Person of the company — with its contacts and
 * addresses — plus what the FSM knows about it. Its write is the person's
 * (`customerPersonWriteSchema`, in `person.ts`).
 */
export interface CustomerDto {
  id: string;
  person: Person;
  equipmentCount: number;
  createdAt: string;
  updatedAt: string;
}

/** A customer as a choice in another record's form: who, and where it can be served. */
export interface CustomerOptionDto {
  id: string;
  name: string;
  document: string | null;
  addresses: AddressDto[];
}

/* -------------------------------------------------------------------------- */
/* Equipment                                                                   */
/* -------------------------------------------------------------------------- */

export const EQUIPMENT_STATUSES = ['ACTIVE', 'UNDER_MAINTENANCE', 'INACTIVE'] as const;
export const equipmentStatusSchema = z.enum(EQUIPMENT_STATUSES);
export type EquipmentStatus = z.infer<typeof equipmentStatusSchema>;

export const equipmentWriteSchema = z
  .object({
    customerId: required('Customer is required', 64),
    /** One of the customer's addresses, or `''`. */
    addressId: z.string().trim(),
    location: text(160),
    name: required('Name is required', 120),
    tag: text(40),
    category: text(80),
    manufacturer: text(80),
    model: text(80),
    serialNumber: text(80),
    installedAt: calendarDay,
    warrantyUntil: calendarDay,
    status: equipmentStatusSchema,
    notes: text(1000),
  })
  .superRefine((data, ctx) => {
    if (data.installedAt && data.warrantyUntil && data.warrantyUntil < data.installedAt) {
      ctx.addIssue({
        code: 'custom',
        message: 'The warranty cannot end before the installation',
        path: ['warrantyUntil'],
      });
    }
  });

export type EquipmentWriteInput = z.infer<typeof equipmentWriteSchema>;
export type EquipmentFormValues = EquipmentWriteInput;

export const emptyEquipmentFormValues: EquipmentFormValues = {
  customerId: '',
  addressId: '',
  location: '',
  name: '',
  tag: '',
  category: '',
  manufacturer: '',
  model: '',
  serialNumber: '',
  installedAt: '',
  warrantyUntil: '',
  status: 'ACTIVE',
  notes: '',
};

export interface EquipmentDto {
  id: string;
  customer: { id: string; name: string };
  address: AddressDto | null;
  location: string | null;
  name: string;
  tag: string | null;
  category: string | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  /** `yyyy-mm-dd`. */
  installedAt: string | null;
  /** `yyyy-mm-dd`. */
  warrantyUntil: string | null;
  status: EquipmentStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export function equipmentToFormValues(equipment: EquipmentDto): EquipmentFormValues {
  return {
    customerId: equipment.customer.id,
    addressId: equipment.address?.id ?? '',
    location: equipment.location ?? '',
    name: equipment.name,
    tag: equipment.tag ?? '',
    category: equipment.category ?? '',
    manufacturer: equipment.manufacturer ?? '',
    model: equipment.model ?? '',
    serialNumber: equipment.serialNumber ?? '',
    installedAt: equipment.installedAt ?? '',
    warrantyUntil: equipment.warrantyUntil ?? '',
    status: equipment.status,
    notes: equipment.notes ?? '',
  };
}

/* -------------------------------------------------------------------------- */
/* Products and services                                                       */
/* -------------------------------------------------------------------------- */

export const CATALOG_ITEM_KINDS = ['PRODUCT', 'SERVICE'] as const;
export const catalogItemKindSchema = z.enum(CATALOG_ITEM_KINDS);
export type CatalogItemKind = z.infer<typeof catalogItemKindSchema>;

export const catalogItemWriteSchema = z.object({
  kind: catalogItemKindSchema,
  code: text(40),
  name: required('Name is required', 160),
  description: text(1000),
  unit: required('Unit is required', 10),
  /** `''`, or a non-negative amount with up to two decimals ("1234.5"). */
  price: z
    .string()
    .trim()
    .refine((value) => value === '' || /^\d{1,10}(\.\d{1,2})?$/.test(value), 'Invalid price'),
  active: z.boolean(),
});

export type CatalogItemWriteInput = z.infer<typeof catalogItemWriteSchema>;
export type CatalogItemFormValues = CatalogItemWriteInput;

export const emptyCatalogItemFormValues: CatalogItemFormValues = {
  kind: 'SERVICE',
  code: '',
  name: '',
  description: '',
  unit: 'UN',
  price: '',
  active: true,
};

export interface CatalogItemDto {
  id: string;
  kind: CatalogItemKind;
  code: string | null;
  name: string;
  description: string | null;
  unit: string;
  /** Decimal as a string ("1234.50"), never a float. */
  price: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export function catalogItemToFormValues(item: CatalogItemDto): CatalogItemFormValues {
  return {
    kind: item.kind,
    code: item.code ?? '',
    name: item.name,
    description: item.description ?? '',
    unit: item.unit,
    price: item.price ?? '',
    active: item.active,
  };
}

/* -------------------------------------------------------------------------- */
/* Work order types                                                            */
/* -------------------------------------------------------------------------- */

export const workOrderTypeWriteSchema = z.object({
  name: required('Name is required', 80),
  description: text(300),
  active: z.boolean(),
});

export type WorkOrderTypeWriteInput = z.infer<typeof workOrderTypeWriteSchema>;
export type WorkOrderTypeFormValues = WorkOrderTypeWriteInput;

export const emptyWorkOrderTypeFormValues: WorkOrderTypeFormValues = {
  name: '',
  description: '',
  active: true,
};

export interface WorkOrderTypeDto {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export function workOrderTypeToFormValues(type: WorkOrderTypeDto): WorkOrderTypeFormValues {
  return { name: type.name, description: type.description ?? '', active: type.active };
}

/** The reference types copied into a company when it contracts the FSM. */
export const REFERENCE_WORK_ORDER_TYPES = [
  { name: 'Installation', description: 'Installing new equipment at the customer.' },
  { name: 'Preventive maintenance', description: 'Scheduled maintenance to avoid failures.' },
  { name: 'Corrective maintenance', description: 'Fixing a failure the customer reported.' },
  { name: 'Technical visit', description: 'An inspection, a survey or a quote visit.' },
] as const;

/** Body of a bulk delete: every id in one transaction, all-or-nothing. */
export const fsmDeleteManySchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'At least one id is required'),
});
