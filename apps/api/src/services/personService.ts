import type { Prisma } from '@prisma/client';
import type { PersonCreateInput, PersonUpdateInput } from '@oliveira/schemas';
import { prisma } from '../config/prisma.js';

interface PersonFilters {
  type?: string;
  active?: string | boolean;
  search?: string;
}

export const personService = {
  async findAll(filters: PersonFilters = {}) {
    const where: Prisma.PersonWhereInput = {};

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.active !== undefined) {
      where.active = filters.active === 'true' || filters.active === true;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { document: { contains: filters.search } },
      ];
    }

    return prisma.person.findMany({ where, orderBy: { createdAt: 'desc' } });
  },

  async findById(id: string) {
    return prisma.person.findUnique({ where: { id } });
  },

  async create(data: PersonCreateInput) {
    return prisma.person.create({
      data: {
        name: data.name,
        email: data.email ?? null,
        phone: data.phone ?? null,
        birthdate: data.birthdate ?? null,
        documentType: data.documentType,
        document: data.document,
        type: data.type,
        active: data.active ?? true,
        street: data.street ?? null,
        city: data.city ?? null,
        state: data.state ?? null,
        zipCode: data.zipCode ?? null,
        notes: data.notes ?? null,
      },
    });
  },

  async update(id: string, data: PersonUpdateInput) {
    return prisma.person.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email ?? null,
        phone: data.phone ?? null,
        birthdate: data.birthdate ?? null,
        documentType: data.documentType,
        document: data.document,
        type: data.type,
        active: data.active ?? true,
        street: data.street ?? null,
        city: data.city ?? null,
        state: data.state ?? null,
        zipCode: data.zipCode ?? null,
        notes: data.notes ?? null,
      },
    });
  },

  async delete(id: string) {
    return prisma.person.delete({ where: { id } });
  },
};
