import type { ZodError, ZodType } from 'zod';
import { BadRequestError } from './errors.js';

/**
 * The API reports one problem at a time — `docs/api/http_responses.md` defines
 * the 400 body as the *first* validation issue, so the message a client sees
 * follows the key order of the schema.
 */
export function firstIssueMessage(error: ZodError): string {
  return error.issues[0]?.message ?? 'Invalid data';
}

/** Parses or throws a 400 carrying that first message. */
export function parseOrThrow<T>(schema: ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);

  if (!parsed.success) {
    throw new BadRequestError(firstIssueMessage(parsed.error));
  }

  return parsed.data;
}
