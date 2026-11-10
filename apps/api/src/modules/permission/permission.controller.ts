import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Product } from '@oliveira/schemas';
import { sendSuccess } from '../../shared/http.js';
import { toPermissionDto } from './permission.mapper.js';
import { permissionRepository } from './permission.repository.js';

/** Handlers for one product's catalog — the product is the route's, see `permission.routes.ts`. */
export function createPermissionController(product: Product) {
  return {
    async list(_request: FastifyRequest, reply: FastifyReply) {
      const rows = await permissionRepository.findMany(product);
      return sendSuccess(reply, 200, rows.map(toPermissionDto));
    },
  };
}
