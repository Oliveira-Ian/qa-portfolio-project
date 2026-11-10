import type { FastifyReply, FastifyRequest } from 'fastify';
import { branchWriteSchema } from '@oliveira/schemas';
import { NotFoundError } from '../../shared/errors.js';
import { message, sendSuccess } from '../../shared/http.js';
import type { WithId } from '../../shared/params.js';
import { parseOrThrow } from '../../shared/validation.js';
import { toBranchDto, toBranchWriteData } from './branch.mapper.js';
import { branchRepository } from './branch.repository.js';

function readQuery(request: FastifyRequest) {
  const query = request.query as { search?: unknown; active?: unknown };
  const search =
    typeof query.search === 'string' && query.search.trim() ? query.search.trim() : undefined;

  return { ...(search ? { search } : {}), activeOnly: query.active === 'true' };
}

/** Small enough to need no service layer: validation in, mapping out. */
export const branchController = {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const rows = await branchRepository.findMany(readQuery(request));

    return sendSuccess(reply, 200, rows.map(toBranchDto));
  },

  async getById(request: FastifyRequest<WithId>, reply: FastifyReply) {
    const row = await branchRepository.findById(request.params.id);

    if (!row) {
      throw new NotFoundError('Branch not found');
    }

    return sendSuccess(reply, 200, toBranchDto(row));
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const input = parseOrThrow(branchWriteSchema, request.body);
    const row = await branchRepository.create(toBranchWriteData(input), input.address);

    return sendSuccess(reply, 201, toBranchDto(row));
  },

  async update(request: FastifyRequest<WithId>, reply: FastifyReply) {
    const input = parseOrThrow(branchWriteSchema, request.body);
    const row = await branchRepository.update(
      request.params.id,
      toBranchWriteData(input),
      input.address,
    );

    return sendSuccess(reply, 200, toBranchDto(row));
  },

  async remove(request: FastifyRequest<WithId>, reply: FastifyReply) {
    await branchRepository.delete(request.params.id);

    return sendSuccess(reply, 200, message('Branch deleted'));
  },
};
