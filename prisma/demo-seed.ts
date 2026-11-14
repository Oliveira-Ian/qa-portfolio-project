import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { config as loadEnv } from 'dotenv';
import { SEED_PROFILE_NAMES, type Product } from '@oliveira/schemas';
import { PrismaClient } from '../apps/api/src/generated/prisma/client.js';
import {
  provisionFsmReferenceData,
  provisionProductProfiles,
  seedPermissionCatalog,
} from './reference-profiles.js';

/**
 * The public demo (plan § 2.7, docs/operations/environments.md): a fictional
 * company with a realistic month of field service — branches, a team, customers
 * with sites and contacts, equipment, a catalog and work orders in every status,
 * with their items and history. Dates are relative to today, so the dashboard
 * always has something scheduled, overdue and recently done.
 *
 *   npm run db:seed:demo    creates the demo company (refuses if it exists)
 *   npm run db:reset:demo   deletes the demo company and everything in it, then
 *                           creates it again — the daily reset
 *
 * Deterministic: fixed ids and the same data every run. Only the demo company
 * and its `@demo.oliveira.app` accounts are ever touched. The reset refuses to
 * run unless `DEMO_DATABASE_NAME` names the database it is connected to.
 *
 * The demo account's password is `DEMO_LOGIN_PASSWORD` (shown on the demo's
 * login page by design); the other members get random passwords nobody knows.
 */

loadEnv({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

const connectionString = process.env.ADMIN_DATABASE_URL ?? process.env.MIGRATION_DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'ADMIN_DATABASE_URL (or MIGRATION_DATABASE_URL) is required — see prisma/.env.example.',
  );
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const SALT_ROUNDS = 10;
const DEMO_DOMAIN = '@demo.oliveira.app';
const DEMO_EMAIL = (process.env.DEMO_LOGIN_EMAIL ?? `demo${DEMO_DOMAIN}`).toLowerCase();
const DEMO_PASSWORD = process.env.DEMO_LOGIN_PASSWORD;

/* -------------------------------------------------------------------------- */
/* Deterministic ids and documents                                             */
/* -------------------------------------------------------------------------- */

/** A fixed UUID (v7 layout) per kind and number — the same every run. */
function id(kind: number, n: number): string {
  const tail = (kind * 0x10000 + n).toString(16).padStart(12, '0');

  return `01d0e000-0000-7000-8000-${tail}`;
}

const COMPANY_ID = id(1, 1);

function checkDigit(digits: number[], weights: number[]): number {
  const sum = digits.reduce((total, digit, index) => total + digit * weights[index]!, 0);
  const rest = sum % 11;

  return rest < 2 ? 0 : 11 - rest;
}

/** A CNPJ with valid check digits, from a 12-digit base. */
function cnpj(base: string): string {
  const digits = base.split('').map(Number);
  const first = checkDigit(digits, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = checkDigit([...digits, first], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const all = `${base}${first}${second}`;

  return `${all.slice(0, 2)}.${all.slice(2, 5)}.${all.slice(5, 8)}/${all.slice(8, 12)}-${all.slice(12)}`;
}

/** A CPF with valid check digits, from a 9-digit base. */
function cpf(base: string): string {
  const digits = base.split('').map(Number);
  const first = checkDigit(digits, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = checkDigit([...digits, first], [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const all = `${base}${first}${second}`;

  return `${all.slice(0, 3)}.${all.slice(3, 6)}.${all.slice(6, 9)}-${all.slice(9)}`;
}

const DAY = 24 * 60 * 60_000;

/** Today at `hour`:`minute` in São Paulo (UTC−3), plus `days`. */
function at(days: number, hour: number, minute = 0): Date {
  const now = new Date();
  const local = new Date(now.getTime() - 3 * 60 * 60_000);
  const midnightUtc = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());

  return new Date(midnightUtc + days * DAY + (hour + 3) * 60 * 60_000 + minute * 60_000);
}

/* -------------------------------------------------------------------------- */
/* The data                                                                    */
/* -------------------------------------------------------------------------- */

const TEAM = [
  {
    key: 'demo',
    name: 'Demo Administrator',
    email: DEMO_EMAIL,
    role: 'ADMIN' as const,
    profile: SEED_PROFILE_NAMES.ADMINISTRATOR,
  },
  {
    key: 'manager',
    name: 'Marina Costa',
    email: `marina.costa${DEMO_DOMAIN}`,
    role: 'MEMBER' as const,
    profile: SEED_PROFILE_NAMES.MANAGER,
  },
  {
    key: 'tech1',
    name: 'Rafael Souza',
    email: `rafael.souza${DEMO_DOMAIN}`,
    role: 'MEMBER' as const,
    profile: SEED_PROFILE_NAMES.TECHNICIAN,
  },
  {
    key: 'tech2',
    name: 'Juliana Alves',
    email: `juliana.alves${DEMO_DOMAIN}`,
    role: 'MEMBER' as const,
    profile: SEED_PROFILE_NAMES.TECHNICIAN,
  },
  {
    key: 'tech3',
    name: 'Bruno Ferreira',
    email: `bruno.ferreira${DEMO_DOMAIN}`,
    role: 'MEMBER' as const,
    profile: SEED_PROFILE_NAMES.TECHNICIAN,
  },
];

const BRANCHES = [
  {
    code: 'SP-01',
    name: 'São Paulo head office',
    city: 'São Paulo',
    street: 'Av. Paulista',
    number: '1578',
    district: 'Bela Vista',
    zipCode: '01310-200',
  },
  {
    code: 'CPS-01',
    name: 'Campinas',
    city: 'Campinas',
    street: 'Av. Norte-Sul',
    number: '1200',
    district: 'Cambuí',
    zipCode: '13025-320',
  },
];

interface DemoCustomer {
  name: string;
  tradeName?: string;
  document: string;
  documentType: 'CPF' | 'CNPJ';
  phone: string;
  email: string;
  sites: {
    label: string;
    street: string;
    number: string;
    district: string;
    city: string;
    zipCode: string;
    reference?: string;
  }[];
  contact?: { name: string; role: string; mobile: string };
}

const CUSTOMERS: DemoCustomer[] = [
  {
    name: 'Hospital Santa Clara Ltda.',
    tradeName: 'Hospital Santa Clara',
    document: cnpj('112223330001'),
    documentType: 'CNPJ',
    phone: '(11) 3456-1200',
    email: 'manutencao@santaclara.example',
    sites: [
      {
        label: 'Main building',
        street: 'Rua Vergueiro',
        number: '2300',
        district: 'Vila Mariana',
        city: 'São Paulo',
        zipCode: '04102-000',
        reference: 'Service entrance on Rua Domingos de Morais',
      },
      {
        label: 'Day clinic',
        street: 'Rua Sena Madureira',
        number: '450',
        district: 'Vila Clementino',
        city: 'São Paulo',
        zipCode: '04021-000',
      },
    ],
    contact: { name: 'Paula Ribeiro', role: 'Maintenance manager', mobile: '(11) 98123-4501' },
  },
  {
    name: 'Supermercados Bom Preço S.A.',
    tradeName: 'Bom Preço',
    document: cnpj('223334440001'),
    documentType: 'CNPJ',
    phone: '(11) 3322-4400',
    email: 'facilities@bompreco.example',
    sites: [
      {
        label: 'Store 12 — Pinheiros',
        street: 'Rua dos Pinheiros',
        number: '870',
        district: 'Pinheiros',
        city: 'São Paulo',
        zipCode: '05422-001',
        reference: 'Loading dock at the back',
      },
      {
        label: 'Store 31 — Campinas',
        street: 'Av. José de Souza Campos',
        number: '900',
        district: 'Cambuí',
        city: 'Campinas',
        zipCode: '13025-320',
      },
    ],
    contact: { name: 'Carlos Mendes', role: 'Facilities coordinator', mobile: '(11) 97222-3344' },
  },
  {
    name: 'Edifício Comercial Faria Lima',
    document: cnpj('334445550001'),
    documentType: 'CNPJ',
    phone: '(11) 3030-9000',
    email: 'sindico@farialima3500.example',
    sites: [
      {
        label: 'Tower',
        street: 'Av. Brigadeiro Faria Lima',
        number: '3500',
        district: 'Itaim Bibi',
        city: 'São Paulo',
        zipCode: '04538-132',
        reference: 'Machine room on the roof, key at the front desk',
      },
    ],
    contact: { name: 'Renata Lima', role: 'Building manager', mobile: '(11) 99812-0011' },
  },
  {
    name: 'Escola Aprender Mais Ltda.',
    tradeName: 'Colégio Aprender Mais',
    document: cnpj('445556660001'),
    documentType: 'CNPJ',
    phone: '(19) 3251-7700',
    email: 'adm@aprendermais.example',
    sites: [
      {
        label: 'Campus',
        street: 'Rua Barão de Jaguara',
        number: '1100',
        district: 'Centro',
        city: 'Campinas',
        zipCode: '13015-002',
      },
    ],
    contact: { name: 'Fernando Dias', role: 'Administrative director', mobile: '(19) 99701-2233' },
  },
  {
    name: 'Padaria Pão de Ouro Ltda.',
    tradeName: 'Pão de Ouro',
    document: cnpj('556667770001'),
    documentType: 'CNPJ',
    phone: '(11) 2577-8800',
    email: 'contato@paodeouro.example',
    sites: [
      {
        label: 'Bakery',
        street: 'Rua Augusta',
        number: '1490',
        district: 'Consolação',
        city: 'São Paulo',
        zipCode: '01304-001',
      },
    ],
  },
  {
    name: 'Clínica Sorriso Odontologia',
    document: cnpj('667778880001'),
    documentType: 'CNPJ',
    phone: '(11) 3884-5500',
    email: 'recepcao@sorriso.example',
    sites: [
      {
        label: 'Clinic',
        street: 'Rua Haddock Lobo',
        number: '595',
        district: 'Cerqueira César',
        city: 'São Paulo',
        zipCode: '01414-001',
        reference: '2nd floor',
      },
    ],
  },
  {
    name: 'Hotel Vista Verde Ltda.',
    tradeName: 'Hotel Vista Verde',
    document: cnpj('778889990001'),
    documentType: 'CNPJ',
    phone: '(19) 3794-1000',
    email: 'manutencao@vistaverde.example',
    sites: [
      {
        label: 'Hotel',
        street: 'Av. Dr. Moraes Salles',
        number: '1500',
        district: 'Centro',
        city: 'Campinas',
        zipCode: '13010-001',
      },
    ],
    contact: { name: 'Lucas Prado', role: 'Chief engineer', mobile: '(19) 98111-7788' },
  },
  {
    name: 'Indústria Metalúrgica Forte S.A.',
    tradeName: 'Metalúrgica Forte',
    document: cnpj('889990000001'),
    documentType: 'CNPJ',
    phone: '(11) 4433-2200',
    email: 'engenharia@forte.example',
    sites: [
      {
        label: 'Plant 1',
        street: 'Av. Industrial',
        number: '2500',
        district: 'Jardim',
        city: 'Santo André',
        zipCode: '09080-500',
        reference: 'Gate 3',
      },
      {
        label: 'Warehouse',
        street: 'Rua das Indústrias',
        number: '120',
        district: 'Jardim',
        city: 'Santo André',
        zipCode: '09080-510',
      },
    ],
    contact: { name: 'Sérgio Nunes', role: 'Maintenance engineer', mobile: '(11) 98777-5544' },
  },
  {
    name: 'Ana Beatriz Martins',
    document: cpf('123456789'),
    documentType: 'CPF',
    phone: '(11) 98234-5566',
    email: 'ana.martins@email.example',
    sites: [
      {
        label: 'Home',
        street: 'Rua Oscar Freire',
        number: '1200',
        district: 'Jardins',
        city: 'São Paulo',
        zipCode: '01426-001',
        reference: 'Apartment 82',
      },
    ],
  },
  {
    name: 'Ricardo Gomes',
    document: cpf('234567891'),
    documentType: 'CPF',
    phone: '(19) 99345-6677',
    email: 'ricardo.gomes@email.example',
    sites: [
      {
        label: 'Home',
        street: 'Rua Coronel Quirino',
        number: '800',
        district: 'Cambuí',
        city: 'Campinas',
        zipCode: '13025-001',
      },
    ],
  },
  {
    name: 'Academia Corpo em Forma Ltda.',
    tradeName: 'Corpo em Forma',
    document: cnpj('990001110001'),
    documentType: 'CNPJ',
    phone: '(11) 3062-1414',
    email: 'gerencia@corpoemforma.example',
    sites: [
      {
        label: 'Gym',
        street: 'Rua Teodoro Sampaio',
        number: '1020',
        district: 'Pinheiros',
        city: 'São Paulo',
        zipCode: '05405-150',
      },
    ],
  },
  {
    name: 'Restaurante Sabor Mineiro Ltda.',
    tradeName: 'Sabor Mineiro',
    document: cnpj('100011120001'),
    documentType: 'CNPJ',
    phone: '(11) 3815-2020',
    email: 'contato@sabormineiro.example',
    sites: [
      {
        label: 'Restaurant',
        street: 'Rua Girassol',
        number: '310',
        district: 'Vila Madalena',
        city: 'São Paulo',
        zipCode: '05433-000',
      },
    ],
  },
];

/** Equipment by customer index: [name, tag, category, manufacturer, model, site index]. */
const EQUIPMENT: [number, string, string, string, string, string, number][] = [
  [0, 'Chiller 01', 'HSC-CH01', 'HVAC', 'Carrier', '30XA-252', 0],
  [0, 'Chiller 02', 'HSC-CH02', 'HVAC', 'Carrier', '30XA-252', 0],
  [0, 'Generator', 'HSC-GE01', 'Power', 'Cummins', 'C500D5', 0],
  [0, 'Split AC — Day clinic', 'HSC-AC07', 'HVAC', 'Daikin', 'FTXS50', 1],
  [1, 'Cold room 1', 'BP12-CR1', 'Refrigeration', 'Bitzer', '4FES-5Y', 0],
  [1, 'Display freezer', 'BP12-FZ3', 'Refrigeration', 'Eletrofrio', 'Vision', 0],
  [1, 'Cold room 2', 'BP31-CR2', 'Refrigeration', 'Bitzer', '4FES-5Y', 1],
  [2, 'Elevator A', 'FL-EL-A', 'Elevator', 'Atlas Schindler', '3300', 0],
  [2, 'Elevator B', 'FL-EL-B', 'Elevator', 'Atlas Schindler', '3300', 0],
  [2, 'Cooling tower', 'FL-TR01', 'HVAC', 'Alpina', 'CTA-300', 0],
  [3, 'Rooftop unit', 'AM-RT01', 'HVAC', 'Trane', 'Voyager', 0],
  [4, 'Deck oven', 'PO-FO01', 'Kitchen', 'Prática', 'Miniconv', 0],
  [5, 'Air compressor', 'CS-CP01', 'Dental', 'Schulz', 'CSD 9', 0],
  [6, 'Boiler', 'HVV-BL01', 'Heating', 'Ecoterm', 'ETG-300', 0],
  [6, 'VRF system', 'HVV-VRF1', 'HVAC', 'LG', 'Multi V 5', 0],
  [7, 'Air compressor 1', 'MF-CP01', 'Compressed air', 'Atlas Copco', 'GA37', 0],
  [7, 'Overhead crane', 'MF-PR01', 'Lifting', 'Demag', 'EKKE', 1],
  [8, 'Split AC — Living room', 'AB-AC01', 'HVAC', 'Samsung', 'WindFree', 0],
];

const CATALOG = [
  {
    kind: 'SERVICE' as const,
    code: 'SV-001',
    name: 'Preventive maintenance visit',
    unit: 'H',
    price: '180.00',
  },
  {
    kind: 'SERVICE' as const,
    code: 'SV-002',
    name: 'Corrective maintenance labor',
    unit: 'H',
    price: '220.00',
  },
  {
    kind: 'SERVICE' as const,
    code: 'SV-003',
    name: 'Refrigerant charge',
    unit: 'UN',
    price: '350.00',
  },
  {
    kind: 'SERVICE' as const,
    code: 'SV-004',
    name: 'Technical inspection report',
    unit: 'UN',
    price: '450.00',
  },
  { kind: 'SERVICE' as const, code: 'SV-005', name: 'Coil cleaning', unit: 'UN', price: '260.00' },
  { kind: 'PRODUCT' as const, code: 'PR-101', name: 'Air filter G4', unit: 'UN', price: '48.90' },
  {
    kind: 'PRODUCT' as const,
    code: 'PR-102',
    name: 'Refrigerant R-410A',
    unit: 'KG',
    price: '95.00',
  },
  {
    kind: 'PRODUCT' as const,
    code: 'PR-103',
    name: 'Compressor contactor',
    unit: 'UN',
    price: '132.50',
  },
  {
    kind: 'PRODUCT' as const,
    code: 'PR-104',
    name: 'Fan motor capacitor',
    unit: 'UN',
    price: '39.90',
  },
  { kind: 'PRODUCT' as const, code: 'PR-105', name: 'V-belt A-42', unit: 'UN', price: '27.00' },
  {
    kind: 'PRODUCT' as const,
    code: 'PR-106',
    name: 'Lubricating oil POE',
    unit: 'L',
    price: '88.00',
  },
  { kind: 'PRODUCT' as const, code: 'PR-107', name: 'Thermostat', unit: 'UN', price: '210.00' },
  { kind: 'PRODUCT' as const, code: 'PR-108', name: 'Copper pipe 3/8"', unit: 'M', price: '32.00' },
  { kind: 'PRODUCT' as const, code: 'PR-109', name: 'Door gasket', unit: 'M', price: '45.00' },
];

type Status = 'OPEN' | 'SCHEDULED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';

interface DemoWorkOrder {
  equipment: number;
  type: number;
  title: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: Status;
  tech?: 'tech1' | 'tech2' | 'tech3';
  /** Scheduled for (days from today, hour). */
  day?: [number, number];
  /** Due (days from today). */
  due?: number;
  items?: [number, string][];
  note?: string;
  resolution?: string;
  reason?: string;
  branch?: number;
}

/** Type index: 0 Installation, 1 Preventive, 2 Corrective, 3 Technical visit (reference order). */
const WORK_ORDERS: DemoWorkOrder[] = [
  {
    equipment: 0,
    type: 1,
    title: 'Monthly preventive maintenance',
    priority: 'NORMAL',
    status: 'COMPLETED',
    tech: 'tech1',
    day: [-20, 9],
    due: -18,
    items: [
      [0, '3'],
      [5, '4'],
    ],
    note: 'Filters were very dirty.',
    resolution: 'Cleaned the coils, replaced 4 filters, checked pressures.',
    branch: 0,
  },
  {
    equipment: 1,
    type: 1,
    title: 'Monthly preventive maintenance',
    priority: 'NORMAL',
    status: 'COMPLETED',
    tech: 'tech1',
    day: [-20, 14],
    due: -18,
    items: [
      [0, '3'],
      [5, '4'],
    ],
    resolution: 'Routine maintenance done, no faults found.',
    branch: 0,
  },
  {
    equipment: 2,
    type: 2,
    title: 'Generator does not start',
    priority: 'URGENT',
    status: 'COMPLETED',
    tech: 'tech2',
    day: [-15, 8],
    due: -15,
    items: [
      [1, '2'],
      [7, '1'],
    ],
    note: 'Battery was fine; contactor burnt.',
    resolution: 'Replaced the start contactor and tested under load for 30 minutes.',
    branch: 0,
  },
  {
    equipment: 4,
    type: 2,
    title: 'Cold room above 5 °C',
    priority: 'HIGH',
    status: 'COMPLETED',
    tech: 'tech3',
    day: [-12, 7],
    due: -12,
    items: [
      [1, '3'],
      [6, '2.5'],
      [2, '1'],
    ],
    resolution: 'Fixed a leak on the suction line and recharged R-410A.',
    branch: 0,
  },
  {
    equipment: 7,
    type: 1,
    title: 'Elevator quarterly inspection',
    priority: 'NORMAL',
    status: 'COMPLETED',
    tech: 'tech2',
    day: [-10, 10],
    due: -9,
    items: [[3, '1']],
    resolution: 'Inspection done; report delivered to the building manager.',
    branch: 0,
  },
  {
    equipment: 11,
    type: 2,
    title: 'Oven not heating evenly',
    priority: 'HIGH',
    status: 'COMPLETED',
    tech: 'tech1',
    day: [-8, 6],
    due: -8,
    items: [
      [1, '1.5'],
      [11, '1'],
    ],
    resolution: 'Replaced the thermostat and calibrated the oven.',
    branch: 0,
  },
  {
    equipment: 13,
    type: 1,
    title: 'Boiler annual service',
    priority: 'NORMAL',
    status: 'COMPLETED',
    tech: 'tech3',
    day: [-6, 9],
    due: -5,
    items: [[0, '4']],
    resolution: 'Burner cleaned, safety valves tested.',
    branch: 1,
  },
  {
    equipment: 15,
    type: 2,
    title: 'Compressor overheating',
    priority: 'HIGH',
    status: 'COMPLETED',
    tech: 'tech2',
    day: [-4, 13],
    due: -4,
    items: [
      [1, '2'],
      [10, '2'],
      [9, '1'],
    ],
    resolution: 'Replaced the oil and the belt; temperature back to normal.',
    branch: 0,
  },
  {
    equipment: 5,
    type: 2,
    title: 'Display freezer making noise',
    priority: 'NORMAL',
    status: 'COMPLETED',
    tech: 'tech3',
    day: [-3, 15],
    due: -2,
    items: [[8, '1']],
    resolution: 'Fan motor capacitor replaced.',
    branch: 0,
  },
  {
    equipment: 17,
    type: 3,
    title: 'Customer reports weak cooling',
    priority: 'LOW',
    status: 'COMPLETED',
    tech: 'tech1',
    day: [-2, 10],
    due: -1,
    items: [[4, '1']],
    resolution: 'Coil cleaned; recommended a filter change every 3 months.',
    branch: 0,
  },
  {
    equipment: 9,
    type: 2,
    title: 'Cooling tower fan vibrating',
    priority: 'HIGH',
    status: 'CANCELLED',
    reason: 'Customer fixed it with their own team.',
    day: [-5, 9],
    branch: 0,
  },
  {
    equipment: 3,
    type: 0,
    title: 'Install a new split AC in room 12',
    priority: 'NORMAL',
    status: 'CANCELLED',
    reason: 'Purchase postponed by the customer.',
    branch: 0,
  },
  // In progress and on hold
  {
    equipment: 6,
    type: 2,
    title: 'Cold room door does not seal',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    tech: 'tech3',
    day: [0, 8],
    due: 0,
    items: [[13, '4.5']],
    note: 'Gasket ordered in the right size.',
    branch: 1,
  },
  {
    equipment: 14,
    type: 1,
    title: 'VRF system quarterly maintenance',
    priority: 'NORMAL',
    status: 'IN_PROGRESS',
    tech: 'tech2',
    day: [0, 9],
    due: 1,
    items: [[0, '2']],
    branch: 1,
  },
  {
    equipment: 16,
    type: 2,
    title: 'Crane hoist stops mid-lift',
    priority: 'URGENT',
    status: 'ON_HOLD',
    tech: 'tech1',
    day: [-1, 8],
    due: -1,
    reason: 'Waiting for the limit switch from the supplier.',
    branch: 0,
  },
  {
    equipment: 10,
    type: 2,
    title: 'Rooftop unit tripping the breaker',
    priority: 'HIGH',
    status: 'ON_HOLD',
    tech: 'tech2',
    day: [-2, 14],
    due: 2,
    reason: 'Customer asked to return after school hours.',
    branch: 1,
  },
  // Scheduled
  {
    equipment: 0,
    type: 1,
    title: 'Monthly preventive maintenance',
    priority: 'NORMAL',
    status: 'SCHEDULED',
    tech: 'tech1',
    day: [0, 14],
    due: 1,
    branch: 0,
  },
  {
    equipment: 1,
    type: 1,
    title: 'Monthly preventive maintenance',
    priority: 'NORMAL',
    status: 'SCHEDULED',
    tech: 'tech1',
    day: [1, 9],
    due: 2,
    branch: 0,
  },
  {
    equipment: 8,
    type: 1,
    title: 'Elevator quarterly inspection',
    priority: 'NORMAL',
    status: 'SCHEDULED',
    tech: 'tech2',
    day: [1, 10],
    due: 3,
    branch: 0,
  },
  {
    equipment: 12,
    type: 1,
    title: 'Dental compressor service',
    priority: 'LOW',
    status: 'SCHEDULED',
    tech: 'tech3',
    day: [2, 8],
    due: 5,
    branch: 0,
  },
  {
    equipment: 4,
    type: 1,
    title: 'Cold room preventive maintenance',
    priority: 'NORMAL',
    status: 'SCHEDULED',
    tech: 'tech3',
    day: [3, 7],
    due: 4,
    branch: 0,
  },
  {
    equipment: 13,
    type: 3,
    title: 'Check boiler pressure drop',
    priority: 'NORMAL',
    status: 'SCHEDULED',
    tech: 'tech1',
    day: [4, 15],
    due: 6,
    branch: 1,
  },
  {
    equipment: 2,
    type: 1,
    title: 'Generator monthly test',
    priority: 'NORMAL',
    status: 'SCHEDULED',
    tech: 'tech2',
    day: [5, 9],
    due: 7,
    branch: 0,
  },
  {
    equipment: 15,
    type: 1,
    title: 'Compressor 2,000-hour service',
    priority: 'NORMAL',
    status: 'SCHEDULED',
    tech: 'tech2',
    day: [7, 8],
    due: 10,
    branch: 0,
  },
  // Open (not yet planned) — two of them overdue
  {
    equipment: 9,
    type: 3,
    title: 'Quote for cooling tower refurbishment',
    priority: 'LOW',
    status: 'OPEN',
    due: 10,
    branch: 0,
  },
  {
    equipment: 3,
    type: 2,
    title: 'Split AC dripping water',
    priority: 'NORMAL',
    status: 'OPEN',
    due: -1,
    branch: 0,
  },
  {
    equipment: 11,
    type: 1,
    title: 'Oven preventive maintenance',
    priority: 'LOW',
    status: 'OPEN',
    due: 14,
    branch: 0,
  },
  {
    equipment: 7,
    type: 2,
    title: 'Elevator A stopping between floors',
    priority: 'URGENT',
    status: 'OPEN',
    due: -2,
    branch: 0,
  },
  {
    equipment: 17,
    type: 0,
    title: 'Install a second split AC in the bedroom',
    priority: 'NORMAL',
    status: 'OPEN',
    due: 12,
    branch: 0,
  },
  {
    equipment: 14,
    type: 3,
    title: 'Energy efficiency survey',
    priority: 'LOW',
    status: 'OPEN',
    due: 20,
    branch: 1,
  },
];

/* -------------------------------------------------------------------------- */
/* Reset and seed                                                              */
/* -------------------------------------------------------------------------- */

async function currentDatabase(): Promise<string> {
  const rows = await prisma.$queryRaw<{ name: string }[]>`SELECT current_database() AS name`;

  return rows[0]!.name;
}

/** Deletes the demo company and its accounts — nothing else. */
async function deleteDemo(): Promise<void> {
  const where = { companyId: COMPANY_ID };

  await prisma.workOrderEvent.deleteMany({ where });
  await prisma.workOrderItem.deleteMany({ where });
  await prisma.workOrder.deleteMany({ where });
  await prisma.fsmCounter.deleteMany({ where });
  await prisma.equipment.deleteMany({ where });
  await prisma.customer.deleteMany({ where });
  await prisma.catalogItem.deleteMany({ where });
  await prisma.workOrderType.deleteMany({ where });
  await prisma.membershipProfile.deleteMany({ where });
  await prisma.productAccess.deleteMany({ where: { membership: { companyId: COMPANY_ID } } });
  await prisma.membership.deleteMany({ where });
  await prisma.contact.deleteMany({ where });
  await prisma.address.deleteMany({ where });
  await prisma.person.deleteMany({ where });
  await prisma.branch.deleteMany({ where });
  await prisma.profilePermission.deleteMany({ where });
  await prisma.accessProfile.deleteMany({ where });
  await prisma.companyProduct.deleteMany({ where });
  await prisma.company.deleteMany({ where: { id: COMPANY_ID } });

  const accounts = await prisma.accessAccount.findMany({
    where: { OR: [{ email: { endsWith: DEMO_DOMAIN } }, { email: DEMO_EMAIL }] },
    select: { id: true },
  });
  const accountIds = accounts.map((account) => account.id);

  await prisma.gridColumnPreference.deleteMany({ where: { accountId: { in: accountIds } } });
  await prisma.accessAccount.deleteMany({ where: { id: { in: accountIds } } });
}

async function seedDemo(): Promise<void> {
  if (!DEMO_PASSWORD) {
    throw new Error('DEMO_LOGIN_PASSWORD is required — the demo account signs in with it.');
  }

  // Catalog of permissions and the company.
  const catalogs = {
    ERP: await seedPermissionCatalog(prisma, 'ERP'),
    FSM: await seedPermissionCatalog(prisma, 'FSM'),
  } as Record<Product, Map<string, number>>;

  await prisma.company.create({
    data: {
      id: COMPANY_ID,
      legalName: 'Oliveira Demo Serviços Técnicos Ltda.',
      tradeName: 'Oliveira Demo Services',
      document: cnpj('987654320001'),
      email: 'contact@demo.oliveira.app',
      phone: '(11) 3000-0000',
      website: 'https://demo.oliveira.app',
      zipCode: '01310-200',
      street: 'Av. Paulista',
      number: '1578',
      district: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      products: { create: [{ product: 'ERP' }, { product: 'FSM', seatLimit: 10 }] },
    },
  });

  const profiles = {
    ERP: await provisionProductProfiles(prisma, COMPANY_ID, 'ERP', catalogs.ERP),
    FSM: await provisionProductProfiles(prisma, COMPANY_ID, 'FSM', catalogs.FSM),
  };
  await provisionFsmReferenceData(prisma, COMPANY_ID);

  // The team.
  const memberships = new Map<string, { id: string; accountId: number; name: string }>();

  for (const member of TEAM) {
    const password = member.key === 'demo' ? DEMO_PASSWORD : randomBytes(24).toString('base64url');
    const account = await prisma.accessAccount.create({
      data: {
        email: member.email,
        name: member.name,
        password: await bcrypt.hash(password, SALT_ROUNDS),
        role: 'USER',
      },
    });
    const membership = await prisma.membership.create({
      data: {
        companyId: COMPANY_ID,
        accountId: account.id,
        role: member.role,
        productAccess: {
          create:
            member.key === 'demo' ? [{ product: 'ERP' }, { product: 'FSM' }] : [{ product: 'FSM' }],
        },
      },
    });

    await prisma.membershipProfile.create({
      data: {
        companyId: COMPANY_ID,
        membershipId: membership.id,
        product: 'FSM',
        profileId: profiles.FSM.get(member.profile)!,
      },
    });

    if (member.key === 'demo') {
      await prisma.membershipProfile.create({
        data: {
          companyId: COMPANY_ID,
          membershipId: membership.id,
          product: 'ERP',
          profileId: profiles.ERP.get(SEED_PROFILE_NAMES.ADMINISTRATOR)!,
        },
      });
    }

    memberships.set(member.key, { id: membership.id, accountId: account.id, name: member.name });
  }

  const demo = memberships.get('demo')!;
  const manager = memberships.get('manager')!;

  // Branches.
  const branchIds: string[] = [];

  for (const [index, branch] of BRANCHES.entries()) {
    const branchId = id(2, index + 1);
    branchIds.push(branchId);
    await prisma.branch.create({
      data: { id: branchId, companyId: COMPANY_ID, code: branch.code, name: branch.name },
    });
    await prisma.address.create({
      data: {
        id: id(3, index + 1),
        companyId: COMPANY_ID,
        branchId,
        type: 'COMMERCIAL',
        isPrimary: true,
        street: branch.street,
        number: branch.number,
        district: branch.district,
        city: branch.city,
        state: 'SP',
        zipCode: branch.zipCode,
      },
    });
  }

  // Customers, with their sites and contacts.
  const customerIds: string[] = [];
  const siteIds: string[][] = [];

  for (const [index, customer] of CUSTOMERS.entries()) {
    const personId = id(4, index + 1);
    const customerId = id(5, index + 1);
    const sites = customer.sites.map((_, site) => id(6, (index + 1) * 10 + site));

    await prisma.person.create({
      data: {
        id: personId,
        companyId: COMPANY_ID,
        name: customer.name,
        tradeName: customer.tradeName ?? null,
        documentType: customer.documentType,
        document: customer.document,
        email: customer.email,
        phone: customer.phone,
        types: [],
      },
    });

    for (const [site, data] of customer.sites.entries()) {
      await prisma.address.create({
        data: {
          id: sites[site]!,
          companyId: COMPANY_ID,
          personId,
          type: customer.documentType === 'CPF' ? 'RESIDENTIAL' : 'SERVICE',
          label: data.label,
          isPrimary: site === 0,
          street: data.street,
          number: data.number,
          district: data.district,
          city: data.city,
          state: 'SP',
          zipCode: data.zipCode,
          reference: data.reference ?? null,
        },
      });
    }

    if (customer.contact) {
      await prisma.contact.create({
        data: {
          id: id(7, index + 1),
          companyId: COMPANY_ID,
          personId,
          name: customer.contact.name,
          role: customer.contact.role,
          mobile: customer.contact.mobile,
          isPrimary: true,
        },
      });
    }

    await prisma.customer.create({ data: { id: customerId, companyId: COMPANY_ID, personId } });
    customerIds.push(customerId);
    siteIds.push(sites);
  }

  // Equipment.
  const equipmentRows: { id: string; customer: number; site: string }[] = [];

  for (const [
    index,
    [customer, name, tag, category, manufacturer, model, site],
  ] of EQUIPMENT.entries()) {
    const equipmentId = id(8, index + 1);
    const addressId = siteIds[customer]![site]!;

    await prisma.equipment.create({
      data: {
        id: equipmentId,
        companyId: COMPANY_ID,
        customerId: customerIds[customer]!,
        addressId,
        name,
        tag,
        category,
        manufacturer,
        model,
        serialNumber: `SN-${(73810 + index * 137).toString()}`,
        installedAt: new Date(Date.UTC(2021 + (index % 4), index % 12, 1 + (index % 27))),
        warrantyUntil: new Date(Date.UTC(2025 + (index % 4), index % 12, 1 + (index % 27))),
        status: 'ACTIVE',
      },
    });
    equipmentRows.push({ id: equipmentId, customer, site: addressId });
  }

  // Catalog.
  const catalogIds: string[] = [];

  for (const [index, item] of CATALOG.entries()) {
    const itemId = id(9, index + 1);
    catalogIds.push(itemId);
    await prisma.catalogItem.create({
      data: { id: itemId, companyId: COMPANY_ID, ...item, active: true },
    });
  }

  const types = await prisma.workOrderType.findMany({
    where: { companyId: COMPANY_ID },
    orderBy: { createdAt: 'asc' },
  });
  const typeByName = new Map(types.map((type) => [type.name, type.id]));
  const typeIds = [
    'Installation',
    'Preventive maintenance',
    'Corrective maintenance',
    'Technical visit',
  ].map((name) => typeByName.get(name)!);

  // Work orders, with their items and history.
  for (const [index, order] of WORK_ORDERS.entries()) {
    const workOrderId = id(10, index + 1);
    const equipment = equipmentRows[order.equipment]!;
    const technician = order.tech ? memberships.get(order.tech)! : null;
    const scheduledAt = order.day ? at(order.day[0], order.day[1]) : null;
    const createdAt = new Date((scheduledAt ?? at(-1, 9)).getTime() - 3 * DAY);
    const startedAt =
      scheduledAt && ['IN_PROGRESS', 'ON_HOLD', 'COMPLETED'].includes(order.status)
        ? new Date(scheduledAt.getTime() + 20 * 60_000)
        : null;
    const completedAt =
      order.status === 'COMPLETED' && startedAt
        ? new Date(startedAt.getTime() + 3 * 60 * 60_000)
        : null;
    const cancelledAt =
      order.status === 'CANCELLED' ? new Date(createdAt.getTime() + 2 * DAY) : null;

    await prisma.workOrder.create({
      data: {
        id: workOrderId,
        companyId: COMPANY_ID,
        number: 1001 + index,
        customerId: customerIds[equipment.customer]!,
        equipmentId: equipment.id,
        serviceAddressId: equipment.site,
        typeId: typeIds[order.type]!,
        branchId: order.branch === undefined ? null : branchIds[order.branch]!,
        title: order.title,
        priority: order.priority,
        status: order.status,
        assigneeMembershipId: technician?.id ?? null,
        scheduledAt,
        dueAt: order.due === undefined ? null : at(order.due, 18),
        startedAt,
        completedAt,
        cancelledAt,
        holdReason: order.status === 'ON_HOLD' ? (order.reason ?? null) : null,
        cancellationReason: order.status === 'CANCELLED' ? (order.reason ?? null) : null,
        resolution: order.resolution ?? null,
        createdById: manager.accountId,
        createdAt,
      },
    });

    const events: {
      type: 'CREATED' | 'ASSIGNED' | 'STATUS_CHANGED' | 'NOTE' | 'ITEM_ADDED';
      at: Date;
      by: { accountId: number; name: string };
      fromStatus?: Status;
      toStatus?: Status;
      message?: string | undefined;
    }[] = [{ type: 'CREATED', at: createdAt, by: manager, toStatus: 'OPEN' }];

    if (technician && scheduledAt) {
      const assignedAt = new Date(createdAt.getTime() + 60 * 60_000);
      events.push({ type: 'ASSIGNED', at: assignedAt, by: manager, message: technician.name });
      events.push({
        type: 'STATUS_CHANGED',
        at: assignedAt,
        by: manager,
        fromStatus: 'OPEN',
        toStatus: 'SCHEDULED',
      });
    }

    if (startedAt && technician) {
      events.push({
        type: 'STATUS_CHANGED',
        at: startedAt,
        by: technician,
        fromStatus: 'SCHEDULED',
        toStatus: 'IN_PROGRESS',
      });

      for (const [item, quantity] of order.items ?? []) {
        const catalog = CATALOG[item]!;
        const itemAt = new Date(startedAt.getTime() + 60 * 60_000);

        await prisma.workOrderItem.create({
          data: {
            companyId: COMPANY_ID,
            workOrderId,
            catalogItemId: catalogIds[item]!,
            kind: catalog.kind,
            name: catalog.name,
            unit: catalog.unit,
            unitPrice: catalog.price,
            quantity,
            createdById: technician.accountId,
            createdAt: itemAt,
          },
        });
        events.push({
          type: 'ITEM_ADDED',
          at: itemAt,
          by: technician,
          message: `${quantity} ${catalog.unit} · ${catalog.name}`,
        });
      }

      if (order.note) {
        events.push({
          type: 'NOTE',
          at: new Date(startedAt.getTime() + 90 * 60_000),
          by: technician,
          message: order.note,
        });
      }

      if (order.status === 'ON_HOLD') {
        events.push({
          type: 'STATUS_CHANGED',
          at: new Date(startedAt.getTime() + 2 * 60 * 60_000),
          by: technician,
          fromStatus: 'IN_PROGRESS',
          toStatus: 'ON_HOLD',
          message: order.reason,
        });
      }

      if (order.status === 'COMPLETED' && completedAt) {
        events.push({
          type: 'STATUS_CHANGED',
          at: completedAt,
          by: technician,
          fromStatus: 'IN_PROGRESS',
          toStatus: 'COMPLETED',
          message: order.resolution,
        });
      }
    }

    if (order.status === 'CANCELLED' && cancelledAt) {
      events.push({
        type: 'STATUS_CHANGED',
        at: cancelledAt,
        by: manager,
        fromStatus: scheduledAt ? 'SCHEDULED' : 'OPEN',
        toStatus: 'CANCELLED',
        message: order.reason,
      });
    }

    for (const event of events) {
      await prisma.workOrderEvent.create({
        data: {
          companyId: COMPANY_ID,
          workOrderId,
          type: event.type,
          fromStatus: event.fromStatus ?? null,
          toStatus: event.toStatus ?? null,
          message: event.message ?? null,
          actorAccountId: event.by.accountId,
          actorName: event.by.name,
          createdAt: event.at,
        },
      });
    }
  }

  await prisma.fsmCounter.create({
    data: { companyId: COMPANY_ID, key: 'work-order', value: 1000 + WORK_ORDERS.length },
  });

  console.log(
    `  demo: ${CUSTOMERS.length} customers, ${EQUIPMENT.length} equipment, ${CATALOG.length} items, ${WORK_ORDERS.length} work orders`,
  );
  console.log(`  demo account: ${DEMO_EMAIL} (membership ${demo.id})`);
}

async function main(): Promise<void> {
  const reset = process.argv.includes('--reset');
  const exists = (await prisma.company.count({ where: { id: COMPANY_ID } })) > 0;

  if (reset) {
    const database = await currentDatabase();

    if (process.env.DEMO_DATABASE_NAME !== database) {
      throw new Error(
        `Refusing to reset: connected to "${database}", and DEMO_DATABASE_NAME is "${process.env.DEMO_DATABASE_NAME ?? ''}". Set it to the demo database's name.`,
      );
    }

    await deleteDemo();
    console.log('  demo: deleted');
  } else if (exists) {
    throw new Error(
      'The demo company already exists — run `npm run db:reset:demo` to recreate it.',
    );
  }

  await seedDemo();
  console.log('Done.');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
