import { z } from 'zod';
import type { AddressDto } from '../address.js';
import { maxLengthMessage } from '../messages.js';
import { paginationQuerySchema, sortQuerySchema } from '../pagination.js';
import { personToFormValues, type CustomerFormValues, type Person } from '../person.js';
import type { WorkOrderPriority } from './work-orders.js';

/**
 * Oliveira FSM's base records (plan § 2.5): customers, equipment, products and
 * services, work order types. One schema per record serves the API and the
 * form: optional text is `''`, and the API stores it as `null`.
 */
const text = (max: number) => z.string().trim().max(max, maxLengthMessage(max));
const required = (message: string, max: number) =>
  z.string().trim().min(1, message).max(max, maxLengthMessage(max));

/** `''` or a calendar day, `yyyy-mm-dd` — what `<input type="date">` and `DatePicker` hold. */
/** `''` or a whole number from 1 to `max` — how a form holds minutes, hours, days. */
const positiveInt = (max: number, message: string) =>
  z
    .string()
    .trim()
    .refine(
      (value) =>
        value === '' || (/^\d{1,6}$/.test(value) && Number(value) >= 1 && Number(value) <= max),
      message,
    );

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
  /** What every technician must know before arriving (shown on every work order). */
  serviceInstructions: string | null;
  /** The branch that usually serves this customer. */
  defaultBranch: { id: string; code: string; name: string } | null;
  /** Work orders that are not completed or cancelled. */
  openWorkOrderCount: number;
  /** Of those, the ones past their due date. */
  overdueWorkOrderCount: number;
  workOrderCount: number;
  createdAt: string;
  updatedAt: string;
}

export const emptyCustomerFormValues: CustomerFormValues = {
  name: '',
  tradeName: '',
  types: [],
  documentType: null,
  document: '',
  stateRegistration: '',
  municipalRegistration: '',
  email: '',
  phone: '',
  mobile: '',
  birthdate: '',
  active: true,
  notes: '',
  addresses: [],
  contacts: [],
  serviceInstructions: '',
  defaultBranchId: '',
};

export function customerToFormValues(customer: CustomerDto): CustomerFormValues {
  return {
    ...personToFormValues(customer.person),
    serviceInstructions: customer.serviceInstructions ?? '',
    defaultBranchId: customer.defaultBranch?.id ?? '',
  };
}

/** A customer as a choice in another record's form: who, and where it can be served. */
export interface CustomerOptionContactDto {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
  mobile: string | null;
  isPrimary: boolean;
}

export interface CustomerOptionDto {
  id: string;
  name: string;
  document: string | null;
  addresses: AddressDto[];
  /** Who can receive the technician on site. */
  contacts: CustomerOptionContactDto[];
  serviceInstructions: string | null;
  defaultBranchId: string | null;
  openWorkOrderCount: number;
}

/* -------------------------------------------------------------------------- */
/* Equipment                                                                   */
/* -------------------------------------------------------------------------- */

export const EQUIPMENT_STATUSES = ['ACTIVE', 'UNDER_MAINTENANCE', 'INACTIVE'] as const;
export const equipmentStatusSchema = z.enum(EQUIPMENT_STATUSES);
export type EquipmentStatus = z.infer<typeof equipmentStatusSchema>;

export const EQUIPMENT_CRITICALITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export const equipmentCriticalitySchema = z.enum(EQUIPMENT_CRITICALITIES);
export type EquipmentCriticality = z.infer<typeof equipmentCriticalitySchema>;

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
    /** `''` when not set. */
    criticality: z.union([equipmentCriticalitySchema, z.literal('')]),
    /** Days between preventive maintenances, `''` when there is no plan. */
    maintenanceIntervalDays: positiveInt(3650, 'Invalid interval'),
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
  criticality: '',
  maintenanceIntervalDays: '',
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
  criticality: EquipmentCriticality | null;
  maintenanceIntervalDays: number | null;
  /** The last completed work order of a type that counts as preventive. */
  lastPreventive: WorkOrderRefDto | null;
  /** `yyyy-mm-dd`: the last preventive (or the installation) plus the interval — calculated, never stored. */
  nextPreventiveDate: string | null;
  /** The last completed work order of any type. */
  lastService: WorkOrderRefDto | null;
  openWorkOrderCount: number;
  workOrderCount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A completed work order, as a record's summary points at it. */
export interface WorkOrderRefDto {
  workOrderId: string;
  number: number;
  /** ISO instant. */
  completedAt: string;
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
    criticality: equipment.criticality ?? '',
    maintenanceIntervalDays: equipment.maintenanceIntervalDays?.toString() ?? '',
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
  /** How long the service usually takes, in minutes (services only), `''` when unknown. */
  estimatedMinutes: positiveInt(10080, 'Invalid duration'),
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
  estimatedMinutes: '',
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
  estimatedMinutes: number | null;
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
    estimatedMinutes: item.estimatedMinutes?.toString() ?? '',
    active: item.active,
  };
}

/* -------------------------------------------------------------------------- */
/* Work order types                                                            */
/* -------------------------------------------------------------------------- */

export const workOrderTypeWriteSchema = z.object({
  name: required('Name is required', 80),
  description: text(300),
  /** Suggested to a new work order of this type, `''` for none. */
  defaultPriority: z.union([z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']), z.literal('')]),
  /** Minutes on site, `''` for none. */
  estimatedMinutes: positiveInt(10080, 'Invalid duration'),
  /** Hours from the visit (or the creation) to the due date, `''` for none. */
  slaHours: positiveInt(8760, 'Invalid time'),
  requiresEquipment: z.boolean(),
  countsAsPreventive: z.boolean(),
  active: z.boolean(),
});

export type WorkOrderTypeWriteInput = z.infer<typeof workOrderTypeWriteSchema>;
export type WorkOrderTypeFormValues = WorkOrderTypeWriteInput;

export const emptyWorkOrderTypeFormValues: WorkOrderTypeFormValues = {
  name: '',
  description: '',
  defaultPriority: '',
  estimatedMinutes: '',
  slaHours: '',
  requiresEquipment: false,
  countsAsPreventive: false,
  active: true,
};

export interface WorkOrderTypeDto {
  id: string;
  name: string;
  description: string | null;
  defaultPriority: WorkOrderPriority | null;
  estimatedMinutes: number | null;
  slaHours: number | null;
  requiresEquipment: boolean;
  countsAsPreventive: boolean;
  /** Work orders of this type — a type in use can only be deactivated. */
  workOrderCount: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export function workOrderTypeToFormValues(type: WorkOrderTypeDto): WorkOrderTypeFormValues {
  return {
    name: type.name,
    description: type.description ?? '',
    defaultPriority: type.defaultPriority ?? '',
    estimatedMinutes: type.estimatedMinutes?.toString() ?? '',
    slaHours: type.slaHours?.toString() ?? '',
    requiresEquipment: type.requiresEquipment,
    countsAsPreventive: type.countsAsPreventive,
    active: type.active,
  };
}

/** The reference types copied into a company when it contracts the FSM. */
export const REFERENCE_WORK_ORDER_TYPES = [
  {
    name: 'Installation',
    description: 'Installing new equipment at the customer.',
    defaultPriority: 'NORMAL',
    estimatedMinutes: 240,
  },
  {
    name: 'Preventive maintenance',
    description: 'Scheduled maintenance to avoid failures.',
    defaultPriority: 'NORMAL',
    estimatedMinutes: 120,
    requiresEquipment: true,
    countsAsPreventive: true,
  },
  {
    name: 'Corrective maintenance',
    description: 'Fixing a failure the customer reported.',
    defaultPriority: 'HIGH',
    estimatedMinutes: 180,
    slaHours: 24,
    requiresEquipment: true,
  },
  {
    name: 'Technical visit',
    description: 'An inspection, a survey or a quote visit.',
    defaultPriority: 'NORMAL',
    estimatedMinutes: 60,
  },
] as const;

/** Body of a bulk delete: every id in one transaction, all-or-nothing. */
export const fsmDeleteManySchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'At least one id is required'),
});
