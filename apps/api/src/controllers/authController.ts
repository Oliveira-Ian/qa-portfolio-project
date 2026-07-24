import type { FastifyReply, FastifyRequest } from 'fastify';
import type { LoginInput, RegisterInput } from '@oliveira/schemas';
import { authenticateUser, registerUser } from '../services/authService.js';
import { isValidEmail } from '../utils/email.js';

// Field checks and messages mirror docs/product/auth_rules.md and
// docs/api/http_responses.md exactly — kept hand-written (not schema-driven)
// so the response contract can't drift from what's documented.

export async function register(
  request: FastifyRequest<{ Body: Partial<RegisterInput> }>,
  reply: FastifyReply,
) {
  const { fullName, email, password, birthDate } = request.body ?? {};

  if (!fullName || !email || !password || !birthDate) {
    return reply.status(400).send({
      success: false,
      error: 'Please fill in all required fields',
    });
  }

  if (!isValidEmail(email)) {
    return reply.status(400).send({
      success: false,
      error: 'Invalid email',
    });
  }

  try {
    const result = await registerUser({ fullName, email, password, birthDate });

    if (!result.success) {
      return reply.status(400).send(result);
    }

    return reply.status(201).send({
      success: true,
      data: { message: 'User created successfully' },
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Server error',
    });
  }
}

export async function login(
  request: FastifyRequest<{ Body: Partial<LoginInput> }>,
  reply: FastifyReply,
) {
  const { email, password } = request.body ?? {};

  if (!email || !password) {
    return reply.status(400).send({
      success: false,
      error: 'Please fill in email and password',
    });
  }

  if (!isValidEmail(email)) {
    return reply.status(400).send({
      success: false,
      error: 'Invalid email format',
    });
  }

  try {
    const result = await authenticateUser({ email, password });

    if (!result.success) {
      return reply.status(401).send(result);
    }

    return reply.status(200).send({
      success: true,
      data: { message: 'Login successful' },
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Server error',
    });
  }
}
