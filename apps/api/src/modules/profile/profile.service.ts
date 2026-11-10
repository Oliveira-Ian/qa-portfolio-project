import type { Prisma } from '../../generated/prisma/client.js';
import type {
  PaginatedResult,
  Product,
  ProfileDto,
  ProfileListQuery,
  ProfileWriteInput,
} from '@oliveira/schemas';
import { BadRequestError, ConflictError, NotFoundError } from '../../shared/errors.js';
import {
  buildFiltersWhere,
  resolveSort,
  toSkipTake,
  type FilterFieldMap,
} from '../../shared/list-query.js';
import { permissionRepository } from '../permission/permission.repository.js';
import { toProfileDto } from './profile.mapper.js';
import { profileRepository, type ProfileWriteData } from './profile.repository.js';

/**
 * The write, with repeated permission ids dropped (they would collide with the
 * `(profile, permission)` key) and every id checked to be in this product's
 * catalog — an ERP profile can never be given an FSM permission, nor the reverse.
 */
async function toWriteData(product: Product, input: ProfileWriteInput): Promise<ProfileWriteData> {
  const permissionIds = [...new Set(input.permissionIds)];

  if (
    permissionIds.length > 0 &&
    (await permissionRepository.countInProduct(permissionIds, product)) !== permissionIds.length
  ) {
    throw new BadRequestError('One or more permissions do not exist');
  }

  return { name: input.name, description: input.description ?? null, permissionIds };
}

/** "Manager (copy)", then "Manager (copy 2)", … — the first name not taken in this product. */
async function copyName(product: Product, name: string): Promise<string> {
  const base = `${name} (copy`;
  const taken = new Set(await profileRepository.namesStartingWith(product, base));

  for (let attempt = 1; ; attempt += 1) {
    const candidate = attempt === 1 ? `${base})` : `${base} ${attempt})`;

    if (!taken.has(candidate)) {
      return candidate;
    }
  }
}

/** `permissionCount` (`profile.permissions.length`) has no entry — it's computed, not a column; see `list()`'s fallback path below. */
const PROFILE_FILTER_FIELDS: FilterFieldMap = {
  name: { field: 'name', kind: 'text' },
  description: { field: 'description', kind: 'text' },
  isDefault: { field: 'isDefault', kind: 'boolean' },
  isSystem: { field: 'isSystem', kind: 'boolean' },
};

const PROFILE_SORT_FIELDS: Record<string, string> = {
  name: 'name',
  description: 'description',
  isDefault: 'isDefault',
  isSystem: 'isSystem',
};

function buildWhere(
  query: ProfileListQuery,
  rawQuery: Record<string, unknown>,
): Prisma.AccessProfileWhereInput {
  const searchWhere: Prisma.AccessProfileWhereInput = query.search
    ? {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      }
    : {};

  const columnFiltersWhere = buildFiltersWhere(
    rawQuery,
    PROFILE_FILTER_FIELDS,
  ) as Prisma.AccessProfileWhereInput;

  return { AND: [searchWhere, columnFiltersWhere] };
}

function readNumberParam(rawQuery: Record<string, unknown>, key: string): number | undefined {
  const value = rawQuery[key];
  return typeof value === 'string' && value.length > 0 ? Number(value) : undefined;
}

/** One product's profiles in the caller's company — the product is the route's (`profile.routes.ts`). */
export const profileService = {
  async list(
    product: Product,
    query: ProfileListQuery,
    rawQuery: Record<string, unknown>,
  ): Promise<PaginatedResult<ProfileDto>> {
    const where = buildWhere(query, rawQuery);
    const permissionCountRange = {
      min: readNumberParam(rawQuery, 'f_permissionCount_min'),
      max: readNumberParam(rawQuery, 'f_permissionCount_max'),
    };
    const hasCountFilter =
      permissionCountRange.min !== undefined || permissionCountRange.max !== undefined;
    const sortsByCount = query.sortBy === 'permissionCount';

    if (!hasCountFilter && !sortsByCount) {
      const orderBy = resolveSort(
        query.sortBy,
        query.sortOrder,
        PROFILE_SORT_FIELDS,
        { name: 'asc' },
        { id: 'asc' },
      ) as Prisma.AccessProfileOrderByWithRelationInput[];
      const { skip, take } = toSkipTake(query);

      const [rows, total] = await Promise.all([
        profileRepository.findMany(product, where, orderBy, skip, take),
        profileRepository.count(product, where),
      ]);

      return { items: rows.map(toProfileDto), total, page: query.page, pageSize: query.pageSize };
    }

    // `permissionCount` is `profile.permissions.length`, not a column —
    // Prisma can't filter or sort a relation-count range without raw SQL.
    // Profiles is an administration list (dozens of rows, not thousands),
    // so fetching every `where`-matched row and handling this one piece in
    // memory is a deliberate, bounded tradeoff — not a performance risk in
    // practice, and far simpler than a raw query for a rarely-used filter.
    const allRows = await profileRepository.findMany(product, where, [
      { name: 'asc' },
      { id: 'asc' },
    ]);
    let dtos = allRows.map(toProfileDto);

    if (hasCountFilter) {
      dtos = dtos.filter((profile) => {
        const count = profile.permissions.length;

        if (permissionCountRange.min !== undefined && count < permissionCountRange.min) {
          return false;
        }

        if (permissionCountRange.max !== undefined && count > permissionCountRange.max) {
          return false;
        }

        return true;
      });
    }

    if (sortsByCount) {
      const direction = query.sortOrder === 'desc' ? -1 : 1;
      dtos = [...dtos].sort((a, b) => direction * (a.permissions.length - b.permissions.length));
    }

    const total = dtos.length;
    const { skip, take } = toSkipTake(query);

    return {
      items: dtos.slice(skip, skip + take),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  },

  async getById(product: Product, id: number): Promise<ProfileDto> {
    const row = await profileRepository.findById(product, id);

    if (!row) {
      throw new NotFoundError('Profile not found');
    }

    return toProfileDto(row);
  },

  async create(product: Product, input: ProfileWriteInput): Promise<ProfileDto> {
    const row = await profileRepository.create(product, await toWriteData(product, input));

    return toProfileDto(row);
  },

  async update(product: Product, id: number, input: ProfileWriteInput): Promise<ProfileDto> {
    const row = await profileRepository.update(product, id, await toWriteData(product, input));

    return toProfileDto(row);
  },

  /**
   * A new, ordinary profile with the source's description and permissions —
   * never its protection or its default flag, which belong to the reference
   * profile alone. Named "<name> (copy)", or the next free number.
   */
  async duplicate(product: Product, id: number): Promise<ProfileDto> {
    const source = await profileRepository.findById(product, id);

    if (!source) {
      throw new NotFoundError('Profile not found');
    }

    const row = await profileRepository.create(product, {
      name: await copyName(product, source.name),
      description: source.description,
      permissionIds: source.permissions.map((link) => link.permissionId),
    });

    return toProfileDto(row);
  },

  async remove(product: Product, id: number): Promise<void> {
    const row = await profileRepository.findById(product, id);

    if (!row) {
      throw new NotFoundError('Profile not found');
    }

    // Protects the reference profiles the product depends on (the default a
    // first seat links, and the fully-permissioned Administrator) from
    // disappearing — see prisma/schema.prisma's AccessProfile.isSystem.
    if (row.isSystem) {
      throw new ConflictError('This profile is protected and cannot be deleted');
    }

    await profileRepository.delete(product, id);
  },
};
