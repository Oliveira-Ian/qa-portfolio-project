import prisma from '../config/prisma.js';

export const personService = {
  async findAll(filters = {}) {
    const where = {};

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

    const persons = await prisma.person.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return persons;
  },

  async findById(id) {
    return prisma.person.findUnique({
      where: { id },
    });
  },

  async create(data) {
    return prisma.person.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        birthdate: data.birthdate ? new Date(data.birthdate) : null,
        documentType: data.documentType,
        document: data.document,
        type: data.type,
        active: data.active !== undefined ? data.active : true,
        street: data.street || null,
        city: data.city || null,
        state: data.state || null,
        zipCode: data.zipCode || null,
        notes: data.notes || null,
      },
    });
  },

  async update(id, data) {
    return prisma.person.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        birthdate: data.birthdate ? new Date(data.birthdate) : null,
        documentType: data.documentType,
        document: data.document,
        type: data.type,
        active: data.active !== undefined ? data.active : true,
        street: data.street || null,
        city: data.city || null,
        state: data.state || null,
        zipCode: data.zipCode || null,
        notes: data.notes || null,
      },
    });
  },

  async delete(id) {
    return prisma.person.delete({
      where: { id },
    });
  },
};
