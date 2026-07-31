import type { FastifyReply, FastifyRequest } from 'fastify';
import { sendSuccess } from '../../shared/http.js';
import { toPermissionDto } from './permission.mapper.js';
import { permissionRepository } from './permission.repository.js';

export const permissionController = {
  async list(_request: FastifyRequest, reply: FastifyReply) {
    const rows = await permissionRepository.findMany();
    return sendSuccess(reply, 200, rows.map(toPermissionDto));
  },
};
