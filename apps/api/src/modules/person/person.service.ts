import type { Prisma } from '../../generated/prisma/client.js';
import type {
  PaginatedResult,
  Person,
  PersonCreateInput,
  PersonListQuery,
  PersonSummaryDto,
} from '@oliveira/schemas';
import { NotFoundError } from '../../shared/errors.js';
import {
  buildFiltersWhere,
  resolveSort,
  toSkipTake,
  type FilterFieldMap,
} from '../../shared/list-query.js';
import { toPersonDto, toPersonWriteData } from './person.mapper.js';
import { recordPersonChange } from './person.metrics.js';
import { personRepository, type PersonLists } from './person.repository.js';

/**
 * One entry per `personColumns` column the People grid lets a user filter
 * (`apps/web/app/erp/records/people/people/_components/person-columns.tsx`)
 * — the whitelist `buildFiltersWhere` checks `f_*` query params against.
 * `types` is the one array-scalar field (`enumArray`, Prisma's `hasSome`);
 * everything else is a plain column.
 */
const PERSON_FILTER_FIELDS: FilterFieldMap = {
  code: { field: 'id', kind: 'text' },
  name: { field: 'name', kind: 'text' },
  types: { field: 'types', kind: 'enumArray' },
  document: { field: 'document', kind: 'text' },
  documentType: { field: 'documentType', kind: 'enumScalar' },
  email: { field: 'email', kind: 'text' },
  phone: { field: 'phone', kind: 'text' },
  active: { field: 'active', kind: 'boolean' },
  createdAt: { field: 'createdAt', kind: 'date' },
  updatedAt: { field: 'updatedAt', kind: 'date' },
};

/** `types` has no entry — sorting by an array column isn't a well-defined operation in Postgres without a custom expression. */
const PERSON_SORT_FIELDS: Record<string, string> = {
  code: 'id',
  name: 'name',
  document: 'document',
  documentType: 'documentType',
  email: 'email',
  phone: 'phone',
  active: 'active',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
};

/**
 * `rawQuery` is the untyped `request.query` object — `buildFiltersWhere`
 * reads its dynamic `f_*` keys directly, since their key set (one per
 * filterable column) doesn't fit `personListQuerySchema`'s fixed shape.
 * Combined with the legacy `type`/`active`/`search` filters via `AND`
 * rather than a shallow object spread, so a legacy and a quick-filter
 * condition on the same field (e.g. `type` and `f_types` both touching
 * `types`) both apply instead of one silently overwriting the other.
 */
function buildWhere(
  query: PersonListQuery,
  rawQuery: Record<string, unknown>,
): Prisma.PersonWhereInput {
  const legacyWhere: Prisma.PersonWhereInput = {};

  if (query.type) {
    legacyWhere.types = { has: query.type };
  }

  if (query.active !== undefined) {
    legacyWhere.active = query.active;
  }

  if (query.search) {
    // Documents are digits, so only the name needs case-insensitive matching.
    legacyWhere.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { tradeName: { contains: query.search, mode: 'insensitive' } },
      { document: { contains: query.search } },
    ];
  }

  const columnFiltersWhere = buildFiltersWhere(
    rawQuery,
    PERSON_FILTER_FIELDS,
  ) as Prisma.PersonWhereInput;

  return { AND: [legacyWhere, columnFiltersWhere, primaryAddressWhere(rawQuery)] };
}

/**
 * The list's City and State columns are the primary address's, which lives in
 * another table — so their quick filters (`f_city`, `f_state`) are matched
 * there rather than through `buildFiltersWhere`'s column map.
 */
function primaryAddressWhere(rawQuery: Record<string, unknown>): Prisma.PersonWhereInput {
  const conditions: Prisma.AddressWhereInput[] = [];

  for (const field of ['city', 'state'] as const) {
    const value = rawQuery[`f_${field}`];

    if (typeof value === 'string' && value.trim() !== '') {
      conditions.push({ [field]: { contains: value.trim(), mode: 'insensitive' } });
    }
  }

  return conditions.length > 0 ? { addresses: { some: { isPrimary: true, AND: conditions } } } : {};
}

/** The record's addresses and contacts, as the write sent them. */
function listsOf(input: PersonCreateInput): PersonLists {
  return { addresses: input.addresses, contacts: input.contacts };
}

export const personService = {
  async list(
    query: PersonListQuery,
    rawQuery: Record<string, unknown>,
  ): Promise<PaginatedResult<Person>> {
    const where = buildWhere(query, rawQuery);
    const orderBy = resolveSort(
      query.sortBy,
      query.sortOrder,
      PERSON_SORT_FIELDS,
      { createdAt: 'desc' },
      { id: 'asc' },
    ) as Prisma.PersonOrderByWithRelationInput[];
    const { skip, take } = toSkipTake(query);

    const [rows, total] = await Promise.all([
      personRepository.findMany(where, orderBy, skip, take),
      personRepository.count(where),
    ]);

    return {
      items: rows.map((row) => toPersonDto(row)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  },

  async summary(): Promise<PersonSummaryDto> {
    const { total, clients, suppliers, inactive, recent } = await personRepository.summary();
    return { total, clients, suppliers, inactive, recent: recent.map((row) => toPersonDto(row)) };
  },

  async getById(id: string): Promise<Person> {
    const row = await personRepository.findById(id);

    if (!row) {
      throw new NotFoundError('Person not found');
    }

    return toPersonDto(row, true);
  },

  async create(input: PersonCreateInput): Promise<Person> {
    const row = await personRepository.create(toPersonWriteData(input), listsOf(input));
    recordPersonChange('create');
    return toPersonDto(row, true);
  },

  async update(id: string, input: PersonCreateInput): Promise<Person> {
    const row = await personRepository.update(id, toPersonWriteData(input), listsOf(input));
    recordPersonChange('update');
    return toPersonDto(row, true);
  },

  async remove(id: string): Promise<void> {
    await personRepository.delete(id);
    recordPersonChange('delete');
  },

  async removeMany(ids: string[]): Promise<void> {
    await personRepository.deleteMany(ids);
    recordPersonChange('delete', ids.length);
  },
};
