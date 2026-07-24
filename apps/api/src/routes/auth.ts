import type { FastifyInstance } from 'fastify';
import { login, register } from '../controllers/authController.js';

export async function authRoutes(app: FastifyInstance) {
  app.post('/login', login);
  app.post('/register', register);
}
