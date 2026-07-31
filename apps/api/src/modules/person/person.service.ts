import type { Prisma } from '@prisma/client';
import type { Person, PersonCreateInput, PersonQuery } from '@oliveira/schemas';
import { NotFoundError } from '../../shared/errors.js';
import { toPersonDto, toPersonWriteData } from './person.mapper.js';
import { personRepository } from './person.repository.js';

function buildWhere(query: PersonQuery): Prisma.PersonWhereInput {
  const where: Prisma.PersonWhereInput = {};

  if (query.type) {
    where.types = { has: query.type };
  }

  if (query.active !== undefined) {
    where.active = query.active;
  }

  if (query.search) {
    // Documents are digits, so only the name needs case-insensitive matching.
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { document: { contains: query.search } },
    ];
  }

  return where;
}

export const personService = {
  async list(query: PersonQuery): Promise<Person[]> {
    const rows = await personRepository.findMany(buildWhere(query));
    return rows.map(toPersonDto);
  },

  async getById(id: string): Promise<Person> {
    const row = await personRepository.findById(id);

    if (!row) {
      throw new NotFoundError('Person not found');
    }

    return toPersonDto(row);
  },

  async create(input: PersonCreateInput): Promise<Person> {
    const row = await personRepository.create(toPersonWriteData(input));
    return toPersonDto(row);
  },

  async update(id: string, input: PersonCreateInput): Promise<Person> {
    const row = await personRepository.update(id, toPersonWriteData(input));
    return toPersonDto(row);
  },

  remove(id: string): Promise<void> {
    return personRepository.delete(id);
  },
};
