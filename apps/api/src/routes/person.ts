import type { FastifyInstance } from 'fastify';
import { personController } from '../controllers/personController.js';

export async function personRoutes(app: FastifyInstance) {
  app.get('/', personController.list);
  app.get('/:id', personController.getById);
  app.post('/', personController.create);
  app.put('/:id', personController.update);
  app.delete('/:id', personController.delete);
}
