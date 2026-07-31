import type { ProfileDto, ProfileWriteInput } from '@oliveira/schemas';
import { ConflictError, NotFoundError } from '../../shared/errors.js';
import { toProfileDto } from './profile.mapper.js';
import { profileRepository } from './profile.repository.js';

export const profileService = {
  async list(): Promise<ProfileDto[]> {
    const rows = await profileRepository.findMany();
    return rows.map(toProfileDto);
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
