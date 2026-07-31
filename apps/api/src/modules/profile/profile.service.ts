import type { Prisma } from '@prisma/client';
import type {
  PaginatedResult,
  ProfileDto,
  ProfileListQuery,
  ProfileWriteInput,
} from '@oliveira/schemas';
import { ConflictError, NotFoundError } from '../../shared/errors.js';
import {
  buildFiltersWhere,
  resolveSort,
  toSkipTake,
  type FilterFieldMap,
} from '../../shared/list-query.js';
import { toProfileDto } from './profile.mapper.js';
import { profileRepository } from './profile.repository.js';

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

export const profileService = {
  async list(
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
        profileRepository.findMany(where, orderBy, skip, take),
        profileRepository.count(where),
      ]);

      return { items: rows.map(toProfileDto), total, page: query.page, pageSize: query.pageSize };
    }

    // `permissionCount` is `profile.permissions.length`, not a column —
    // Prisma can't filter or sort a relation-count range without raw SQL.
    // Profiles is an administration list (dozens of rows, not thousands),
    // so fetching every `where`-matched row and handling this one piece in
    // memory is a deliberate, bounded tradeoff — not a performance risk in
    // practice, and far simpler than a raw query for a rarely-used filter.
    const allRows = await profileRepository.findMany(where, [{ name: 'asc' }, { id: 'asc' }]);
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

  async getById(id: number): Promise<ProfileDto> {
    const row = await profileRepository.findById(id);

    if (!row) {
      throw new NotFoundError('Profile not found');
    }

    return toProfileDto(row);
  },

  async create(input: ProfileWriteInput): Promise<ProfileDto> {
    const row = await profileRepository.create({
      name: input.name,
      description: input.description ?? null,
      permissionIds: input.permissionIds,
    });

    return toProfileDto(row);
  },

  async update(id: number, input: ProfileWriteInput): Promise<ProfileDto> {
    const row = await profileRepository.update(id, {
      name: input.name,
      description: input.description ?? null,
      permissionIds: input.permissionIds,
    });

    return toProfileDto(row);
  },

  async remove(id: number): Promise<void> {
    const row = await profileRepository.findById(id);

    if (!row) {
      throw new NotFoundError('Profile not found');
    }

    // Protects the profiles the system depends on (self-registration's
    // default, and the fully-permissioned Administrator) from disappearing —
    // see prisma/schema.prisma's AccessProfile.isSystem doc comment.
    if (row.isSystem) {
      throw new ConflictError('This profile is protected and cannot be deleted');
    }

    await profileRepository.delete(id);
  },
};
